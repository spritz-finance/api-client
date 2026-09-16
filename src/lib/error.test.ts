import { describe, expect, expectTypeOf, it } from 'vitest'
import {
    APIConnectionError,
    APIError,
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    NotFoundError,
    PermissionDeniedError,
    RateLimitError,
    hasProblemCode,
    hasProblemType,
    isAPIError,
} from './error'

describe('APIError', () => {
    const headers = {
        requestId: 'req_123',
        traceId: 'trace_123',
    }

    it('uses RFC 7807 detail as the partner-facing message', () => {
        const problem = {
            type: 'urn:problem-type:validation:invalid-input',
            title: 'Invalid Input',
            status: 400,
            detail: 'amountUsd must be a positive decimal string',
        }
        const error = APIError.generate(400, problem, undefined, headers)

        expect(error).toBeInstanceOf(BadRequestError)
        expect(error.name).toBe('BadRequestError')
        expect(error.status).toBe(400)
        expect(error.message).toBe('amountUsd must be a positive decimal string')
        expect(error.error).toEqual(problem)
        expect(error.headers).toEqual(headers)
    })

    it('preserves RFC 7807 requirement payload for SDK consumers', () => {
        const error = APIError.generate(
            403,
            {
                type: 'urn:problem-type:forbidden',
                title: 'Identity Verification Required',
                status: 403,
                detail: 'You must complete identity verification to access this feature.',
                requirement: {
                    type: 'identity_verification',
                    description: 'Verify your identity to unlock platform features',
                    status: 'not_started',
                },
            },
            undefined,
            headers
        )

        expect(error).toBeInstanceOf(PermissionDeniedError)
        expect(error.status).toBe(403)
        expect(error.message).toBe(
            'You must complete identity verification to access this feature.'
        )
        expect(error.error?.requirement).toEqual({
            type: 'identity_verification',
            description: 'Verify your identity to unlock platform features',
            status: 'not_started',
        })
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

describe('ProblemDetails', () => {
    const headers = { requestId: 'req_123', traceId: 'trace_123' }

    it('exposes a complete RFC 9457 problem through `problem`', () => {
        const problem = {
            type: 'urn:problem-type:deposits:limit-exceeded',
            title: 'Deposit Limit Exceeded',
            status: 400,
            detail: 'amountUsd exceeds the current transaction limit.',
            instance: '/errors/1234567890',
            code: 'transaction_limit',
            field: 'amountUsd',
            retryable: true,
            retryAfter: 30,
            suggestedAction: 'Lower the amount and try again.',
            clearsAt: '2026-01-02T00:00:00.000Z',
            availableAt: null,
            permanent: false,
        }
        const error = APIError.generate(400, problem, undefined, headers)

        expect(error.problem).toEqual(problem)
        expect(error.problem?.clearsAt).toBe('2026-01-02T00:00:00.000Z')
        // `null` is documented and distinct from absence.
        expect(error.problem?.availableAt).toBeNull()
    })

    it('detects an idempotency conflict with hasProblemType', () => {
        const error = APIError.generate(
            422,
            {
                type: 'urn:problem-type:idempotency-conflict',
                title: 'Idempotency Conflict',
                status: 422,
                detail: 'This key was already used with a different request body.',
            },
            undefined,
            headers
        )

        expect(hasProblemType(error, 'urn:problem-type:idempotency-conflict')).toBe(true)
        expect(hasProblemType(error, 'urn:problem-type:validation:invalid-input')).toBe(false)
        // A generic 422 with no problem type must not match.
        expect(
            hasProblemType(
                APIError.generate(422, { title: 'Unprocessable' }, undefined, headers),
                'urn:problem-type:idempotency-conflict'
            )
        ).toBe(false)
        expect(hasProblemType(new Error('nope'), 'urn:problem-type:idempotency-conflict')).toBe(
            false
        )
        expect(hasProblemType(undefined, 'urn:problem-type:idempotency-conflict')).toBe(false)

        if (hasProblemType(error, 'urn:problem-type:idempotency-conflict')) {
            expectTypeOf(
                error.problem.type
            ).toEqualTypeOf<'urn:problem-type:idempotency-conflict'>()
        }
    })

    it('retains a single-cause code and field, and narrows with hasProblemCode', () => {
        const error = APIError.generate(
            400,
            { title: 'Bad Request', status: 400, code: 'minimum_deposit', field: 'amountUsd' },
            undefined,
            headers
        )

        expect(error.problem?.code).toBe('minimum_deposit')
        expect(error.problem?.field).toBe('amountUsd')
        expect(hasProblemCode(error, 'minimum_deposit')).toBe(true)
        expect(hasProblemCode(error, 'transaction_limit')).toBe(false)
        expect(hasProblemCode(new Error('nope'), 'minimum_deposit')).toBe(false)
    })

    it('normalizes a multi-field errors array', () => {
        const error = APIError.generate(
            400,
            {
                title: 'Invalid Input',
                status: 400,
                errors: [
                    { field: 'amountUsd', message: 'Must be a positive decimal string' },
                    { field: 'sourceId', message: 'Unknown funding source', code: 'not_found' },
                ],
            },
            undefined,
            headers
        )

        expect(error.problem?.errors).toEqual([
            { field: 'amountUsd', message: 'Must be a positive decimal string' },
            { field: 'sourceId', message: 'Unknown funding source', code: 'not_found' },
        ])
    })

    it('drops malformed entries from the errors array without throwing', () => {
        const error = APIError.generate(
            400,
            {
                title: 'Invalid Input',
                errors: [
                    { field: 'amountUsd', message: 'ok' },
                    { field: 'missingMessage' },
                    { message: 'missing field' },
                    { field: 1, message: 'wrong type' },
                    { field: 'badCode', message: 'ok', code: 42 },
                    'not an object',
                    null,
                ],
            },
            undefined,
            headers
        )

        expect(error.problem?.errors).toEqual([
            { field: 'amountUsd', message: 'ok' },
            // The invalid `code` is dropped, the valid entry is kept.
            { field: 'badCode', message: 'ok' },
        ])
    })

    it('omits fields whose runtime type does not match the contract', () => {
        const payload = {
            type: 123,
            title: 'Kept',
            status: '400',
            detail: null,
            retryable: 'yes',
            retryAfter: 'soon',
            permanent: 1,
            clearsAt: 5,
            errors: { field: 'notAnArray' },
        }
        const error = APIError.generate(400, payload, undefined, headers)

        expect(error.problem).toEqual({ title: 'Kept' })
        // The untouched payload is still available for debugging.
        expect(error.error).toEqual(payload)
    })

    it('omits unknown fields from problem but keeps them in error', () => {
        const payload = {
            type: 'urn:problem-type:auth:unauthorized',
            title: 'Unauthorized',
            status: 401,
            realm: 'spritz',
            scope: 'deposits:write',
            clearsAtIsEstimate: true,
            nested: { anything: [1, 2, 3] },
        }
        const error = APIError.generate(401, payload, undefined, headers)

        expect(error.problem).toEqual({
            type: 'urn:problem-type:auth:unauthorized',
            title: 'Unauthorized',
            status: 401,
        })
        expect(error.problem).not.toHaveProperty('realm')
        expect(error.problem).not.toHaveProperty('clearsAtIsEstimate')
        expect(error.error).toEqual(payload)
        expect(error.error?.['realm']).toBe('spritz')
    })

    it('leaves problem undefined when nothing documented survives', () => {
        expect(APIError.generate(500, { foo: 'bar' }, undefined, headers).problem).toBeUndefined()
        expect(
            APIError.generate(500, undefined, 'Server exploded', headers).problem
        ).toBeUndefined()
    })

    it('exposes requestId and traceId directly and keeps headers intact', () => {
        const error = APIError.generate(404, { title: 'Not Found' }, undefined, headers)

        expect(error.requestId).toBe('req_123')
        expect(error.traceId).toBe('trace_123')
        expect(error.headers).toEqual(headers)
    })

    it('leaves correlation ids undefined when the response carried none', () => {
        const error = APIError.generate(404, { title: 'Not Found' }, undefined, {
            requestId: null,
            traceId: undefined,
        })

        expect(error.requestId).toBeUndefined()
        expect(error.traceId).toBeUndefined()
    })

    it('keeps existing error, subclass, message and status behaviour unchanged', () => {
        const problem = {
            type: 'urn:problem-type:validation:invalid-input',
            title: 'Invalid Input',
            status: 400,
            detail: 'amountUsd must be a positive decimal string',
        }
        const error = APIError.generate(400, problem, undefined, headers)

        expect(error).toBeInstanceOf(BadRequestError)
        expect(error.name).toBe('BadRequestError')
        expect(error.status).toBe(400)
        // `detail` still drives the message, ahead of `title`.
        expect(error.message).toBe('amountUsd must be a positive decimal string')
        expect(error.error).toEqual(problem)
        expect(isAPIError(error)).toBe(true)
        expect(isAPIError(new Error('plain'))).toBe(false)
        expect(isAPIError(null)).toBe(false)
    })

    it('handles a text (non-JSON) error body', () => {
        const error = APIError.generate(502, undefined, 'Bad Gateway', headers)

        expect(error).toBeInstanceOf(InternalServerError)
        expect(error.message).toBe('Bad Gateway')
        expect(error.problem).toBeUndefined()
        expect(error.error).toBeUndefined()
        expect(error.requestId).toBe('req_123')
    })

    it('leaves connection errors without problem or correlation ids', () => {
        const error = new APIConnectionError({ cause: new Error('socket hang up') })

        expect(error).toBeInstanceOf(APIError)
        expect(error.status).toBeUndefined()
        expect(error.problem).toBeUndefined()
        expect(error.requestId).toBeUndefined()
        expect(error.traceId).toBeUndefined()
        expect(isAPIError(error)).toBe(true)
        expect(hasProblemType(error, 'urn:problem-type:idempotency-conflict')).toBe(false)
    })
})
