import { createHmac } from 'node:crypto'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Environment } from '../../env'
import { APIConnectionError, APIError, ConflictError } from '../../lib/error'
import { SpritzApiClient } from '../../spritzApiClient'
import { server } from '../../test/setup'
import type { Deposit, DepositListQuery, DepositListResponse } from './depositService'

const BASE = 'https://sandbox.spritz.finance'
const INTEGRATION_KEY = 'ik_test_key'
const INTEGRATOR_SECRET = 'is_test_secret'
const API_KEY = 'ak_test_key'
const FROZEN_NOW = 1_764_547_200_000

/**
 * Independent reimplementation of the documented canonical payload
 * (`${timestamp}.${METHOD}.${pathWithQuery}.${bodyHash}`) so the assertion does
 * not lean on the SDK's own signing helpers.
 */
function expectedSignature(timestamp: number, method: string, pathWithQuery: string) {
    const payload = `${timestamp}.${method}.${pathWithQuery}.`
    const digest = createHmac('sha256', INTEGRATOR_SECRET).update(payload).digest('hex')
    return `sha256=${digest}`
}

const DEPOSIT = {
    id: 'dep_01JV7Q8M4Y8K6N2Z5P3R1T9W0X',
    sourceId: 'fs_01JV7Q8M4Y8K6N2Z5P3R1T9W0X',
    onRampId: null,
    status: 'authorized',
    quoteType: 'exact_input',
    requestedPriority: 'normal',
    priority: 'normal',
    feeRateBps: 100,
    principalAmountUsd: '500.00',
    instantPortionUsd: '0.00',
    settlementPortionUsd: '500.00',
    expectedAssetAmount: '500.00',
    grossFeeUsd: '5.00',
    publishedFeeUsd: '5.00',
    regularPublishedFeeUsd: '5.00',
    instantPublishedFeeUsd: '7.50',
    feeSubsidyUsd: '0.00',
    userFeeUsd: '5.00',
    totalDebitAmountUsd: '505.00',
    feeSubsidy: null,
    network: 'solana',
    asset: 'USDC',
    assetAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    address: 'YourUsersSolanaWallet',
    debitStatus: 'authorized',
    releaseStatus: 'not_started',
    releaseDecisionMode: 'after_settlement',
    releasedAmountUsd: '0.00',
    confirmedReleasedAmountUsd: '0.00',
    authorizedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    settledAt: null,
    returnedAt: null,
    completedAt: null,
    returnCode: null,
    returnReason: null,
    debitFailureCode: null,
    debitFailureReason: null,
    releaseFailureCode: null,
    releaseFailureReason: null,
    payoutTxHash: null,
} as const

describe('DepositService REST integration', () => {
    const client = SpritzApiClient.initialize({
        environment: Environment.Sandbox,
        apiKey: API_KEY,
        integrationKey: INTEGRATION_KEY,
        integratorSecret: INTEGRATOR_SECRET,
    })

    beforeEach(() => {
        vi.spyOn(Date, 'now').mockReturnValue(FROZEN_NOW)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    function captureListRequest(
        body: Record<string, unknown> = { data: [], hasMore: false, nextCursor: null }
    ) {
        const seen: { url?: string; headers?: Record<string, string> } = {}

        server.use(
            http.get(`${BASE}/v1/deposits/`, ({ request }) => {
                seen.url = request.url
                seen.headers = Object.fromEntries(request.headers.entries())
                return HttpResponse.json(body)
            })
        )

        return seen
    }

    it('requests the collection with its trailing slash and no query string', async () => {
        const seen = captureListRequest()

        await client.deposit.list()

        expect(seen.url).toBe(`${BASE}/v1/deposits/`)
    })

    it('serializes query parameters sorted and percent-encoded', async () => {
        const seen = captureListRequest()

        await client.deposit.list({ limit: 25, cursor: 'next page' })

        expect(seen.url).toBe(`${BASE}/v1/deposits/?cursor=next%20page&limit=25`)
    })

    it('omits undefined query values', async () => {
        const seen = captureListRequest()

        // The generated contract forbids an explicit `undefined` under
        // exactOptionalPropertyTypes; the cast models a caller spreading a
        // partially-populated page cursor at runtime.
        await client.deposit.list({ limit: 25, cursor: undefined } as unknown as DepositListQuery)

        expect(seen.url).toBe(`${BASE}/v1/deposits/?limit=25`)
    })

    it('signs the exact path including its query string', async () => {
        const seen = captureListRequest()

        await client.deposit.list({ limit: 25, cursor: 'next page' })

        const pathWithQuery = '/v1/deposits/?cursor=next%20page&limit=25'
        expect(new URL(seen.url ?? '').pathname + new URL(seen.url ?? '').search).toBe(
            pathWithQuery
        )
        expect(seen.headers?.['x-timestamp']).toBe(String(FROZEN_NOW))
        expect(seen.headers?.['x-integrator-key']).toBe(INTEGRATION_KEY)
        expect(seen.headers?.['x-signature']).toBe(
            expectedSignature(FROZEN_NOW, 'GET', pathWithQuery)
        )
    })

    it('signs the encoded single-segment deposit id', async () => {
        const seen: { url?: string; headers?: Record<string, string> } = {}

        server.use(
            http.get(`${BASE}/v1/deposits/:depositId`, ({ request }) => {
                seen.url = request.url
                seen.headers = Object.fromEntries(request.headers.entries())
                return HttpResponse.json(DEPOSIT)
            })
        )

        await client.deposit.get('dep/one')

        expect(seen.url).toBe(`${BASE}/v1/deposits/dep%2Fone`)
        expect(seen.headers?.['x-signature']).toBe(
            expectedSignature(FROZEN_NOW, 'GET', '/v1/deposits/dep%2Fone')
        )
    })

    it('carries the per-user bearer key and integrator key', async () => {
        const seen = captureListRequest()

        await client.deposit.list()

        expect(seen.headers?.['authorization']).toBe(`Bearer ${API_KEY}`)
        expect(seen.headers?.['x-integrator-key']).toBe(INTEGRATION_KEY)
        // The unsigned integration-key header is replaced by the stamped set.
        expect(seen.headers?.['x-integration-key']).toBeUndefined()
    })

    it('reuses the bearer key set by setApiKey', async () => {
        const seen = captureListRequest()

        const rotated = SpritzApiClient.initialize({
            environment: Environment.Sandbox,
            apiKey: API_KEY,
            integrationKey: INTEGRATION_KEY,
            integratorSecret: INTEGRATOR_SECRET,
        })
        rotated.setApiKey('ak_rotated_key')

        await rotated.deposit.list()

        expect(seen.headers?.['authorization']).toBe('Bearer ak_rotated_key')
    })

    it('returns the typed list payload', async () => {
        captureListRequest({ data: [DEPOSIT], hasMore: true, nextCursor: 'dep_cursor_2' })

        const result = await client.deposit.list({ limit: 1 })

        expectTypeOf(result).toEqualTypeOf<DepositListResponse>()
        expect(result.hasMore).toBe(true)
        expect(result.nextCursor).toBe('dep_cursor_2')
        expect(result.data).toHaveLength(1)
        expect(result.data[0]?.id).toBe(DEPOSIT.id)
        expect(result.data[0]?.debitStatus).toBe('authorized')
        expect(result.data[0]?.releaseStatus).toBe('not_started')
    })

    it('returns the typed deposit payload', async () => {
        server.use(http.get(`${BASE}/v1/deposits/:depositId`, () => HttpResponse.json(DEPOSIT)))

        const result = await client.deposit.get(DEPOSIT.id)

        expectTypeOf(result).toEqualTypeOf<Deposit>()
        expect(result).toEqual(DEPOSIT)
    })

    it('normalizes structured non-2xx responses into APIError with trace headers', async () => {
        const problem = {
            type: 'urn:problem-type:deposits:risk-review-required',
            title: 'Risk Review Required',
            status: 409,
            detail: 'This deposit needs review.',
            code: 'risk_review_required',
            retryable: false,
        }

        server.use(
            http.get(`${BASE}/v1/deposits/:depositId`, () =>
                HttpResponse.json(problem, {
                    status: 409,
                    headers: {
                        'content-type': 'application/problem+json',
                        'x-amzn-requestid': 'req_123',
                        'x-amzn-trace-id': 'trace_123',
                    },
                })
            )
        )

        const error = await client.deposit.get('dep_123').catch((err: unknown) => err)

        expect(error).toBeInstanceOf(ConflictError)
        expect(error).toBeInstanceOf(APIError)
        const apiError = error as ConflictError
        expect(apiError.status).toBe(409)
        expect(apiError.message).toBe('This deposit needs review.')
        expect(apiError.error).toEqual(problem)
        expect(apiError.headers).toEqual({ requestId: 'req_123', traceId: 'trace_123' })
    })

    it('normalizes transport failures into APIConnectionError', async () => {
        server.use(http.get(`${BASE}/v1/deposits/`, () => HttpResponse.error()))

        const error = await client.deposit.list().catch((err: unknown) => err)

        expect(error).toBeInstanceOf(APIConnectionError)
        expect((error as APIConnectionError).status).toBeUndefined()
        expect((error as APIConnectionError).cause).toBeInstanceOf(Error)
    })
})
