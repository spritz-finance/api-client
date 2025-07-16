import { castToError, Headers } from './util'

export class SpritzApiError extends Error {
    readonly timestamp: string
    readonly headers: Headers

    constructor(message: string, headers?: Headers, ...params: any[]) {
        super(...params)
        this.name = 'SpritzApiError'
        this.message = message
        this.headers = headers ?? {}
        this.timestamp = new Date().toISOString()
    }
}

export class APIError extends Error {
    readonly status: number | undefined
    readonly headers: Headers | undefined
    readonly timestamp: string

    constructor(
        status: number | undefined,
        error: Record<string, any> | undefined,
        message: string | undefined,
        headers: Headers | undefined
    ) {
        super(APIError.makeMessage(error, message))
        this.status = status
        this.headers = headers
        this.timestamp = new Date().toISOString()
    }

    private static makeMessage(error: any, message: string | undefined) {
        return error?.message
            ? typeof error.message === 'string'
                ? error.message
                : JSON.stringify(error.message)
            : error
              ? JSON.stringify(error)
              : message || 'Unknown error occurred'
    }

    static generate(
        status: number | undefined,
        error: Record<string, any> | undefined,
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
