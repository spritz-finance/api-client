import { createHash, createHmac } from 'node:crypto'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Environment } from '../../env'
import { APIError } from '../../lib/error'
import { SpritzApiClient } from '../../spritzApiClient'
import { server } from '../../test/setup'
import type { AchDebitEligibilityResponse } from './achDebitService'

const BASE = 'https://sandbox.spritz.finance'
const PATH = '/v1/ach-debit/eligibility'
const INTEGRATION_KEY = 'ik_test_key'
const INTEGRATOR_SECRET = 'is_test_secret'
const FROZEN_NOW = 1_764_547_200_000

/**
 * Independent reimplementation of the documented canonical payload
 * (`${timestamp}.${METHOD}.${pathWithQuery}.${bodyHash}`) so the assertion does
 * not lean on the SDK's own signing helpers.
 */
function expectedSignature(timestamp: number, method: string, path: string, body: string) {
    const bodyHash = createHash('sha256').update(body).digest('hex')
    const payload = `${timestamp}.${method}.${path}.${bodyHash}`
    const digest = createHmac('sha256', INTEGRATOR_SECRET).update(payload).digest('hex')
    return `sha256=${digest}`
}

describe('AchDebitService REST integration', () => {
    const client = SpritzApiClient.initialize({
        environment: Environment.Sandbox,
        integrationKey: INTEGRATION_KEY,
        integratorSecret: INTEGRATOR_SECRET,
    })

    beforeEach(() => {
        vi.spyOn(Date, 'now').mockReturnValue(FROZEN_NOW)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    function captureEligibility(status: number, body: unknown, headers?: Record<string, string>) {
        const seen: { url?: string; body?: string; headers?: Record<string, string> } = {}

        server.use(
            http.post(`${BASE}${PATH}`, async ({ request }) => {
                seen.url = request.url
                seen.body = await request.text()
                seen.headers = Object.fromEntries(request.headers.entries())
                return HttpResponse.json(body, { status, ...(headers ? { headers } : {}) })
            })
        )

        return seen
    }

    it('posts the email as a JSON body to the eligibility route', async () => {
        const seen = captureEligibility(200, { eligible: true })

        const result = await client.achDebit.checkEligibility({ email: 'user@example.com' })

        expect(seen.url).toBe(`${BASE}${PATH}`)
        expect(seen.body).toBe('{"email":"user@example.com"}')
        expect(seen.headers?.['content-type']).toBe('application/json')
        expect(result).toStrictEqual({ eligible: true })
    })

    it('signs the request over the path and the body it sends', async () => {
        const seen = captureEligibility(200, { eligible: true })

        await client.achDebit.checkEligibility({ email: 'user@example.com' })

        expect(seen.headers?.['x-timestamp']).toBe(String(FROZEN_NOW))
        expect(seen.headers?.['x-integrator-key']).toBe(INTEGRATION_KEY)
        expect(seen.headers?.['x-signature']).toBe(
            expectedSignature(FROZEN_NOW, 'POST', PATH, seen.body ?? '')
        )
    })

    it('reports an ineligible address as a successful response, not an error', async () => {
        captureEligibility(200, { eligible: false })

        await expect(
            client.achDebit.checkEligibility({ email: 'user@example.com' })
        ).resolves.toStrictEqual({ eligible: false })
    })

    it('surfaces a problem response as a typed APIError', async () => {
        captureEligibility(
            400,
            {
                type: 'urn:problem-type:validation',
                title: 'Invalid request',
                status: 400,
                detail: 'email must be a valid email address',
                code: 'invalid_email',
                field: 'email',
            },
            { 'x-amzn-requestid': 'req_123', 'x-amzn-trace-id': 'trace_123' }
        )

        const error = await client.achDebit
            .checkEligibility({ email: 'not-an-email' })
            .catch((e: unknown) => e)

        expect(error).toBeInstanceOf(APIError)
        const apiError = error as APIError
        expect(apiError.status).toBe(400)
        expect(apiError.problem?.code).toBe('invalid_email')
        expect(apiError.problem?.field).toBe('email')
        expect(apiError.requestId).toBe('req_123')
        expect(apiError.traceId).toBe('trace_123')
    })

    it('types the response as the contract verdict shape', async () => {
        captureEligibility(200, { eligible: true })

        const result = await client.achDebit.checkEligibility({ email: 'user@example.com' })

        expectTypeOf(result).toEqualTypeOf<AchDebitEligibilityResponse>()
        expectTypeOf(result.eligible).toEqualTypeOf<boolean>()
    })
})
