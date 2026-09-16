import { castToError, Headers } from './util'

type APIErrorPayload = Record<string, unknown>

/** One field-level cause inside a problem's `errors` array. */
export type ProblemFieldError = {
    field: string
    message: string
    code?: string
}

/**
 * The values the contract documents for `suggestedAction`, left open so a value
 * the API adds later still parses instead of being silently dropped.
 */
export type ProblemSuggestedAction = 'auto_ramp' | 'wait_for_settlement' | (string & {})

/**
 * The API's RFC 9457 problem response.
 *
 * Every field is optional because this is parsed defensively from an untrusted
 * error payload: the contract marks `title` and `status` required, but a
 * response that omits them should still surface whatever it did send rather
 * than collapsing to nothing.
 *
 * Some fields only appear on certain problems — `realm`/`scope` on some 401s,
 * `resourceType`/`resourceId` on 404s — so check before reading them. Anything
 * the API sends that is not modelled here stays readable on `APIError.error`.
 */
export type ProblemDetails = {
    /** Problem type URI, e.g. `urn:problem-type:idempotency-conflict`. */
    type?: string
    title?: string
    status?: number
    /** Human-facing explanation. Written for integrators, not end users. */
    detail?: string
    instance?: string
    /** Machine-readable cause, present when exactly one thing failed. */
    code?: string
    /** The offending request field, present alongside `code`. */
    field?: string
    /** Field-level causes, present when more than one thing failed. */
    errors?: ProblemFieldError[]
    retryable?: boolean
    retryAfter?: number
    suggestedAction?: ProblemSuggestedAction
    clearsAt?: string | null
    availableAt?: string | null
    permanent?: boolean
    /** Authentication realm, on some `401` problems. */
    realm?: string
    /** Scope required for the resource, on some `401` problems. */
    scope?: string
    /** Type of the missing resource. The contract requires it on `404`s. */
    resourceType?: string
    /** Identifier of the missing resource. The contract requires it on `404`s. */
    resourceId?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Readers ignore inherited properties, so a polluted `Object.prototype` cannot
 * put a field onto a problem the response never sent.
 */
function readString(source: Record<string, unknown>, key: string): string | undefined {
    if (!Object.hasOwn(source, key)) return undefined
    const value = source[key]
    return typeof value === 'string' ? value : undefined
}

function readNumber(source: Record<string, unknown>, key: string): number | undefined {
    if (!Object.hasOwn(source, key)) return undefined
    const value = source[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function readBoolean(source: Record<string, unknown>, key: string): boolean | undefined {
    if (!Object.hasOwn(source, key)) return undefined
    const value = source[key]
    return typeof value === 'boolean' ? value : undefined
}

/**
 * `null` is documented for these and is distinct from absence: it says "not
 * bounded by time" rather than "not reported".
 */
function readNullableString(
    source: Record<string, unknown>,
    key: string
): string | null | undefined {
    if (!Object.hasOwn(source, key)) return undefined
    const value = source[key]
    if (value === null) return null
    return typeof value === 'string' ? value : undefined
}

function readProblemErrors(
    source: Record<string, unknown>,
    key: string
): ProblemFieldError[] | undefined {
    const value = Object.hasOwn(source, key) ? source[key] : undefined
    if (!Array.isArray(value)) return undefined

    const errors: ProblemFieldError[] = []

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

    // An array that yielded nothing is no more informative than no array at
    // all, and leaving it out keeps `problem` absent for a payload with nothing
    // documented in it.
    return errors.length > 0 ? errors : undefined
}

/** Assigns only when the reader found a value, so absent fields stay absent. */
function set<K extends keyof ProblemDetails>(
    problem: ProblemDetails,
    key: K,
    value: ProblemDetails[K] | undefined
) {
    if (value !== undefined) problem[key] = value
}

/**
 * Build a `ProblemDetails` from an untrusted error payload.
 *
 * Returns undefined when nothing documented survived, so a present
 * `APIError.problem` means the response really was RFC 9457-shaped. Never
 * throws: a malformed error response must not replace the real failure.
 */
function parseProblemDetails(payload: unknown): ProblemDetails | undefined {
    if (!isRecord(payload)) return undefined

    const problem: ProblemDetails = {}

    set(problem, 'type', readString(payload, 'type'))
    set(problem, 'title', readString(payload, 'title'))
    set(problem, 'status', readNumber(payload, 'status'))
    set(problem, 'detail', readString(payload, 'detail'))
    set(problem, 'instance', readString(payload, 'instance'))
    set(problem, 'code', readString(payload, 'code'))
    set(problem, 'field', readString(payload, 'field'))
    set(problem, 'errors', readProblemErrors(payload, 'errors'))
    set(problem, 'retryable', readBoolean(payload, 'retryable'))
    set(problem, 'retryAfter', readNumber(payload, 'retryAfter'))
    set(problem, 'suggestedAction', readString(payload, 'suggestedAction'))
    set(problem, 'clearsAt', readNullableString(payload, 'clearsAt'))
    set(problem, 'availableAt', readNullableString(payload, 'availableAt'))
    set(problem, 'permanent', readBoolean(payload, 'permanent'))
    set(problem, 'realm', readString(payload, 'realm'))
    set(problem, 'scope', readString(payload, 'scope'))
    set(problem, 'resourceType', readString(payload, 'resourceType'))
    set(problem, 'resourceId', readString(payload, 'resourceId'))

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

export class APIError extends Error {
    readonly status: number | undefined
    /**
     * The parsed response payload exactly as the API sent it.
     *
     * Kept untouched for logging and for reading fields `ProblemDetails` does
     * not model. Prefer `problem` for anything you branch on.
     */
    readonly error: APIErrorPayload | undefined
    /** The response's RFC 9457 problem details, when it sent one. */
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

        const requestId = headers?.['requestId']
        if (requestId) this.requestId = requestId

        const traceId = headers?.['traceId']
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
