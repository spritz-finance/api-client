import { describe, expect, it } from 'vitest'
import {
    APIConnectionError,
    APIError,
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    NotFoundError,
    PermissionDeniedError,
    RateLimitError,
} from './error'

describe('APIError', () => {
    const headers = {
        requestId: 'req_123',
        traceId: 'trace_123',
    }

    it('uses RFC 7807 detail as the partner-facing message', () => {
        const error = APIError.generate(
            400,
            {
                type: 'urn:problem-type:validation:invalid-input',
                title: 'Invalid Input',
                status: 400,
                detail: 'amountUsd must be a positive decimal string',
            },
            undefined,
            headers
        )

        expect(error).toBeInstanceOf(BadRequestError)
        expect(error.name).toBe('BadRequestError')
        expect(error.status).toBe(400)
        expect(error.message).toBe('amountUsd must be a positive decimal string')
        expect(error.headers).toEqual(headers)
    })

    it('falls back to RFC 7807 title when detail is absent', () => {
        const error = APIError.generate(
            403,
            {
                type: 'urn:problem-type:auth:forbidden',
                title: 'ACH debit is not enabled for this integrator',
                status: 403,
            },
            undefined,
            headers
        )

        expect(error).toBeInstanceOf(PermissionDeniedError)
        expect(error.status).toBe(403)
        expect(error.message).toBe('ACH debit is not enabled for this integrator')
        expect(error.headers?.requestId).toBe('req_123')
    })

    it('keeps legacy message payload support', () => {
        const error = APIError.generate(
            404,
            {
                message: 'Funding source not found',
            },
            undefined,
            headers
        )

        expect(error).toBeInstanceOf(NotFoundError)
        expect(error.status).toBe(404)
        expect(error.message).toBe('Funding source not found')
    })

    it('falls back to non-JSON response text when no error payload is parsed', () => {
        const error = APIError.generate(500, undefined, 'upstream unavailable', headers)

        expect(error).toBeInstanceOf(InternalServerError)
        expect(error.message).toBe('upstream unavailable')
        expect(error.headers?.traceId).toBe('trace_123')
    })

    it('maps common HTTP statuses to specific error classes', () => {
        expect(
            APIError.generate(401, { title: 'Unauthorized' }, undefined, headers)
        ).toBeInstanceOf(AuthenticationError)
        expect(
            APIError.generate(429, { title: 'Rate Limited' }, undefined, headers)
        ).toBeInstanceOf(RateLimitError)
    })

    it('preserves connection errors for missing HTTP status', () => {
        const error = APIError.generate(
            undefined,
            { message: 'network down' },
            undefined,
            undefined
        )

        expect(error).toBeInstanceOf(APIConnectionError)
        expect(error.status).toBeUndefined()
        expect(error.message).toBe('Connection error.')
    })
})
