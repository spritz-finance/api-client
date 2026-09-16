import { castToError, Headers } from './util'

type APIErrorPayload = Record<string, unknown>

/** One field-level cause inside a problem's `errors` array. */
export type ProblemDetailsError = {
    field: string
    message: string
    code?: string
}

/**
 * The API's RFC 9457 problem response.
 *
 * Every field is optional because this is parsed defensively from an untrusted
 * error payload: the contract marks `title` and `status` required, but an error
 * response that omits them should still surface whatever it did send rather
 * than collapsing to nothing. A field is present here only when the payload
 * carried it with its documented runtime type; anything else is dropped, and
 * the untouched payload stays on `APIError.error`.
 */
export type ProblemDetails = {
    /** Problem type URI, e.g. `urn:problem-type:idempotency-conflict`. */
    type?: string
    title?: string
    status?: number
    /** Human-facing explanation. Trusted server-side consumers only. */
    detail?: string
    instance?: string
    /** Machine-readable cause, present when exactly one thing failed. */
    code?: string
    /** The offending request field, present alongside `code`. */
    field?: string
    /** Field-level causes, present when more than one thing failed. */
    errors?: ProblemDetailsError[]
    retryable?: boolean
    retryAfter?: number
    suggestedAction?: string
    clearsAt?: string | null
    availableAt?: string | null
    permanent?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(source: Record<string, unknown>, key: string): string | undefined {
    const value = source[key]
    return typeof value === 'string' ? value : undefined
}

function readNumber(source: Record<string, unknown>, key: string): number | undefined {
    const value = source[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function readBoolean(source: Record<string, unknown>, key: string): boolean | undefined {
    const value = source[key]
    return typeof value === 'boolean' ? value : undefined
}

/**
 * `null` is a documented value for these, and distinct from absence: the API
 * uses it to say "known to be unbounded" rather than "not reported".
 */
function readNullableString(
    source: Record<string, unknown>,
    key: string
): string | null | undefined {
    const value = source[key]
    if (value === null) return null
    return typeof value === 'string' ? value : undefined
}

function parseProblemErrors(value: unknown): ProblemDetailsError[] | undefined {
    if (!Array.isArray(value)) return undefined

    const errors: ProblemDetailsError[] = []

    for (const item of value) {
        if (!isRecord(item)) continue

        // `field` and `message` are both required on an item; without them the
        // entry says nothing, so drop it rather than emit a partial cause.
        const field = readString(item, 'field')
        const message = readString(item, 'message')
        if (field === undefined || message === undefined) continue

        const code = readString(item, 'code')
        errors.push({ field, message, ...(code !== undefined ? { code } : {}) })
    }

    return errors
}

/**
 * Build a `ProblemDetails` from an untrusted error payload.
 *
 * Returns undefined when nothing documented survived, so the presence of
 * `APIError.problem` means the response really was RFC 9457-shaped. Never
 * throws: a malformed error response must not replace the real failure.
 */
export function parseProblemDetails(payload: unknown): ProblemDetails | undefined {
    if (!isRecord(payload)) return undefined

    const problem: ProblemDetails = {}

    const type = readString(payload, 'type')
    if (type !== undefined) problem.type = type

    const title = readString(payload, 'title')
    if (title !== undefined) problem.title = title

    const status = readNumber(payload, 'status')
    if (status !== undefined) problem.status = status

    const detail = readString(payload, 'detail')
    if (detail !== undefined) problem.detail = detail

    const instance = readString(payload, 'instance')
    if (instance !== undefined) problem.instance = instance

    const code = readString(payload, 'code')
    if (code !== undefined) problem.code = code

    const field = readString(payload, 'field')
    if (field !== undefined) problem.field = field

    const errors = parseProblemErrors(payload['errors'])
    if (errors !== undefined) problem.errors = errors

    const retryable = readBoolean(payload, 'retryable')
    if (retryable !== undefined) problem.retryable = retryable

    const retryAfter = readNumber(payload, 'retryAfter')
    if (retryAfter !== undefined) problem.retryAfter = retryAfter

    const suggestedAction = readString(payload, 'suggestedAction')
    if (suggestedAction !== undefined) problem.suggestedAction = suggestedAction

    const clearsAt = readNullableString(payload, 'clearsAt')
    if (clearsAt !== undefined) problem.clearsAt = clearsAt

    const availableAt = readNullableString(payload, 'availableAt')
    if (availableAt !== undefined) problem.availableAt = availableAt

    const permanent = readBoolean(payload, 'permanent')
    if (permanent !== undefined) problem.permanent = permanent

    return Object.keys(problem).length > 0 ? problem : undefined
}

function stringifyError(value: unknown): string {
    if (typeof value === 'string') {
        return value
    }

    try {
        return JSON.stringify(value)
    } catch {
        return String(value)
    }
}

function getStringField(error: unknown, field: string): string | undefined {
    if (!error || typeof error !== 'object' || !(field in error)) {
        return undefined
    }

    const value = (error as Record<string, unknown>)[field]
    if (typeof value === 'string' && value.length > 0) {
        return value
    }

    return undefined
}

export class SpritzApiError extends Error {
    readonly timestamp: string
    readonly headers: Headers

    constructor(message: string, headers?: Headers) {
        super(message)
        this.name = 'SpritzApiError'
        this.message = message
        this.headers = headers ?? {}
        this.timestamp = new Date().toISOString()
    }
}

function readCorrelationId(headers: Headers | undefined, key: string): string | undefined {
    const value = headers?.[key]
    return typeof value === 'string' && value.length > 0 ? value : undefined
}

export class APIError extends Error {
    readonly status: number | undefined
    /**
     * The parsed response payload exactly as the API sent it.
     *
     * Kept untouched for logging and for reading fields `ProblemDetails` does
     * not model. Prefer `problem` for anything you branch on.
     */
    readonly error: APIErrorPayload | undefined
    /**
     * The response's RFC 9457 problem details, when it sent one.
     *
     * Only documented fields carrying their documented runtime type appear
     * here. Undefined for a transport failure, a non-JSON body, or a payload
     * with nothing recognizable in it.
     */
    readonly problem?: ProblemDetails
    readonly headers: Headers | undefined
    /** Correlation id from `x-amzn-requestid`, also present in `headers`. */
    readonly requestId?: string
    /** Trace id from `x-amzn-trace-id`, also present in `headers`. */
    readonly traceId?: string
    readonly timestamp: string

    constructor(
        status: number | undefined,
        error: APIErrorPayload | undefined,
        message: string | undefined,
        headers: Headers | undefined
    ) {
        super(APIError.makeMessage(error, message))
        this.status = status
        this.error = error
        this.headers = headers
        this.timestamp = new Date().toISOString()

        const problem = parseProblemDetails(error)
        if (problem) this.problem = problem

        const requestId = readCorrelationId(headers, 'requestId')
        if (requestId) this.requestId = requestId

        const traceId = readCorrelationId(headers, 'traceId')
        if (traceId) this.traceId = traceId
    }

    private static makeMessage(error: unknown, message: string | undefined) {
        const problemDetail = getStringField(error, 'detail')
        if (problemDetail) return problemDetail

        const problemTitle = getStringField(error, 'title')
        if (problemTitle) return problemTitle

        const errorMessage = getStringField(error, 'message')
        if (errorMessage) return errorMessage

        if (error !== undefined) {
            return stringifyError(error)
        }

        return message || 'Unknown error occurred'
    }

    static generate(
        status: number | undefined,
        error: APIErrorPayload | undefined,
        message: string | undefined,
        headers: Headers | undefined
    ) {
        if (!status) {
            return new APIConnectionError({ cause: castToError(error) })
        }

        if (status === 400) {
            return new BadRequestError(status, error, message, headers)
        }

        if (status === 401) {
            return new AuthenticationError(status, error, message, headers)
        }

        if (status === 403) {
            return new PermissionDeniedError(status, error, message, headers)
        }

        if (status === 404) {
            return new NotFoundError(status, error, message, headers)
        }

        if (status === 409) {
            return new ConflictError(status, error, message, headers)
        }

        if (status === 422) {
            return new UnprocessableEntityError(status, error, message, headers)
        }

        if (status === 429) {
            return new RateLimitError(status, error, message, headers)
        }

        if (status >= 500) {
            return new InternalServerError(status, error, message, headers)
        }

        return new APIError(status, error, message, headers)
    }
}

export class APIUserAbortError extends APIError {
    override readonly status: undefined = undefined

    constructor({ message }: { message?: string } = {}) {
        super(undefined, undefined, message || 'Request was aborted.', undefined)
    }
}

export class APIConnectionError extends APIError {
    override readonly status: undefined = undefined

    constructor({ message, cause }: { message?: string; cause?: Error | undefined }) {
        super(undefined, undefined, message || 'Connection error.', undefined)
        if (cause) this.cause = cause
    }
}

export class APIConnectionTimeoutError extends APIConnectionError {
    constructor() {
        super({ message: 'Request timed out.' })
    }
}

export class BadRequestError extends APIError {
    override readonly name = 'BadRequestError'
    override readonly status = 400 as const
}

export class AuthenticationError extends APIError {
    override readonly name = 'AuthenticationError'
    override readonly status = 401 as const
}

export class PermissionDeniedError extends APIError {
    override readonly name = 'PermissionDeniedError'
    override readonly status = 403 as const
}

export class NotFoundError extends APIError {
    override readonly name = 'NotFoundError'
    override readonly status = 404 as const
}

export class ConflictError extends APIError {
    override readonly name = 'ConflictError'
    override readonly status = 409 as const
}

export class UnprocessableEntityError extends APIError {
    override readonly name = 'UnprocessableEntityError'
    override readonly status = 422 as const
}

export class RateLimitError extends APIError {
    override readonly name = 'RateLimitError'
    override readonly status = 429 as const
}

export class InternalServerError extends APIError {
    override readonly name = 'InternalServerError'
}

/** Narrows an unknown caught value to an `APIError`. */
export function isAPIError(error: unknown): error is APIError {
    return error instanceof APIError
}

/**
 * Narrows to an `APIError` whose problem carries exactly `type`.
 *
 * ```ts
 * if (hasProblemType(error, 'urn:problem-type:idempotency-conflict')) {
 *     // error.problem.type is narrowed to that literal
 * }
 * ```
 */
export function hasProblemType<T extends string>(
    error: unknown,
    type: T
): error is APIError & { problem: ProblemDetails & { type: T } } {
    return isAPIError(error) && error.problem?.type === type
}

/** Narrows to an `APIError` whose problem carries exactly `code`. */
export function hasProblemCode<T extends string>(
    error: unknown,
    code: T
): error is APIError & { problem: ProblemDetails & { code: T } } {
    return isAPIError(error) && error.problem?.code === code
}
