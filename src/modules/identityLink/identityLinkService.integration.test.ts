import { createHash, createHmac } from 'node:crypto'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Environment } from '../../env'
import { APIError, ConflictError, NotFoundError, hasProblemCode } from '../../lib/error'
import { SpritzApiClient } from '../../spritzApiClient'
import { server } from '../../test/setup'
import type { IdentityLinkSession, IdentityLinkSessionStatus } from './identityLinkService'

const BASE = 'https://sandbox.spritz.finance'
const CREATE_PATH = '/v1/users/me/identity-link-sessions'
const INTEGRATION_KEY = 'ik_test_key'
const INTEGRATOR_SECRET = 'is_test_secret'
const API_KEY = 'ak_new_account_key'
const FROZEN_NOW = 1_764_547_200_000
const SESSION_ID = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b'
const STATUS_PATH = `/v1/link/sessions/${SESSION_ID}/status`
// 43 url-safe characters like a real link token, but not one.
const LINK_TOKEN = 'Ab3dEf9hIjKlMnOpQrStUvWxYz0123456789-_abcde'

const SESSION: IdentityLinkSession = {
    sessionId: SESSION_ID,
    authorizationUrl: `https://flows-staging.spritz.finance/link/${SESSION_ID}#link_token=${LINK_TOKEN}`,
    expiresAt: '2026-10-09T12:15:00.000Z',
}

const UNAVAILABLE = {
    type: 'urn:problem-type:resource:not-found',
    title: 'Not Found',
    status: 404,
    detail: 'Identity linking is not available.',
    code: 'IDENTITY_LINKING_UNAVAILABLE',
}

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

type Seen = { url?: string; body?: string; headers?: Record<string, string> }

function capture(path: string, status: number, body: JsonBodyType): Seen {
    const seen: Seen = {}

    server.use(
        http.post(`${BASE}${path}`, async ({ request }) => {
            seen.url = request.url
            seen.body = await request.text()
            seen.headers = Object.fromEntries(request.headers.entries())
            return HttpResponse.json(body, {
                status,
                headers: { 'Cache-Control': 'no-store' },
            })
        })
    )

    return seen
}

describe('IdentityLinkService REST integration', () => {
    const client = SpritzApiClient.initialize({
        environment: Environment.Sandbox,
        integrationKey: INTEGRATION_KEY,
        integratorSecret: INTEGRATOR_SECRET,
        apiKey: API_KEY,
    })

    beforeEach(() => {
        vi.spyOn(Date, 'now').mockReturnValue(FROZEN_NOW)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('createSession', () => {
        it('starts the session as the new account, signed by the integrator', async () => {
            const seen = capture(CREATE_PATH, 201, SESSION)

            const result = await client.identityLink.createSession({
                redirectUri: 'https://partner.example/spritz/link/callback',
                state: 'attempt-1',
            })

            expect(seen.url).toBe(`${BASE}${CREATE_PATH}`)
            expect(seen.body).toBe(
                '{"redirectUri":"https://partner.example/spritz/link/callback","state":"attempt-1"}'
            )
            expect(seen.headers?.['content-type']).toBe('application/json')
            // The account context is the new account's key; the integrator signs the call.
            expect(seen.headers?.['authorization']).toBe(`Bearer ${API_KEY}`)
            expect(seen.headers?.['x-integrator-key']).toBe(INTEGRATION_KEY)
            expect(seen.headers?.['x-timestamp']).toBe(String(FROZEN_NOW))
            expect(seen.headers?.['x-signature']).toBe(
                expectedSignature(FROZEN_NOW, 'POST', CREATE_PATH, seen.body ?? '')
            )
            expect(result).toStrictEqual(SESSION)
            expectTypeOf(result).toEqualTypeOf<IdentityLinkSession>()
        })

        it('uses the key set with setApiKey, so a later account can be linked', async () => {
            const seen = capture(CREATE_PATH, 201, SESSION)
            const rotated = SpritzApiClient.initialize({
                environment: Environment.Sandbox,
                integrationKey: INTEGRATION_KEY,
                integratorSecret: INTEGRATOR_SECRET,
                apiKey: 'ak_first_account_key',
            }).setApiKey('ak_second_account_key')

            await rotated.identityLink.createSession({
                redirectUri: 'https://partner.example/cb',
                state: 'attempt-2',
            })

            expect(seen.headers?.['authorization']).toBe('Bearer ak_second_account_key')
        })

        it('surfaces the feature being off as a NotFoundError with the documented code', async () => {
            capture(CREATE_PATH, 404, UNAVAILABLE)

            const error = await client.identityLink
                .createSession({ redirectUri: 'https://partner.example/cb', state: 's' })
                .catch((e: unknown) => e)

            expect(error).toBeInstanceOf(NotFoundError)
            expect(hasProblemCode(error, 'IDENTITY_LINKING_UNAVAILABLE')).toBe(true)
            expect((error as NotFoundError).problem?.status).toBe(404)
        })

        it('surfaces an ineligible account as a ConflictError with the documented code', async () => {
            capture(CREATE_PATH, 409, {
                type: 'urn:problem-type:resource:conflict',
                title: 'Conflict',
                status: 409,
                detail: 'This account cannot start an identity link.',
                code: 'LINK_NOT_ELIGIBLE',
                retryable: false,
            })

            const error = await client.identityLink
                .createSession({ redirectUri: 'https://partner.example/cb', state: 's' })
                .catch((e: unknown) => e)

            expect(error).toBeInstanceOf(ConflictError)
            expect(hasProblemCode(error, 'LINK_NOT_ELIGIBLE')).toBe(true)
            expect((error as ConflictError).problem?.retryable).toBe(false)
        })
    })

    describe('get', () => {
        it('reads the status with the link token in the body and nowhere else', async () => {
            const seen = capture(STATUS_PATH, 200, { status: 'compared', comparison: 'passed' })

            const result = await client.identityLink.get({
                sessionId: SESSION_ID,
                linkToken: LINK_TOKEN,
            })

            expect(seen.url).toBe(`${BASE}${STATUS_PATH}`)
            expect(seen.body).toBe(`{"linkToken":"${LINK_TOKEN}"}`)
            expect(seen.url).not.toContain(LINK_TOKEN)
            for (const value of Object.values(seen.headers ?? {})) {
                expect(value).not.toContain(LINK_TOKEN)
            }
            expect(seen.headers?.['x-signature']).toBe(
                expectedSignature(FROZEN_NOW, 'POST', STATUS_PATH, seen.body ?? '')
            )
            expect(result).toStrictEqual({ status: 'compared', comparison: 'passed' })
            expectTypeOf(result).toEqualTypeOf<IdentityLinkSessionStatus>()
        })

        it('reports a terminal session as a status, not an error', async () => {
            capture(STATUS_PATH, 200, { status: 'expired', comparison: null })

            await expect(
                client.identityLink.get({ sessionId: SESSION_ID, linkToken: LINK_TOKEN })
            ).resolves.toStrictEqual({ status: 'expired', comparison: null })
        })

        /**
         * The API answers an unknown session and a wrong token alike: a 404 with no code,
         * which is what tells it apart from IDENTITY_LINKING_UNAVAILABLE. The SDK passes
         * it through and never dresses it up as a session.
         */
        it('surfaces an unknown session or wrong token as a NotFoundError without details', async () => {
            const wrongToken = 'Zz9yXw8vUt7sRq6pOn5mLk4jIh3gFe2dCb1a0_-ZYXW'
            const problem = {
                type: 'urn:problem-type:resource:not-found',
                title: 'Not Found',
                status: 404,
                detail: 'Link session not found.',
            }
            capture(STATUS_PATH, 404, problem)

            const error = await client.identityLink
                .get({ sessionId: SESSION_ID, linkToken: wrongToken })
                .catch((e: unknown) => e)

            expect(error).toBeInstanceOf(NotFoundError)
            const apiError = error as APIError
            expect(apiError.message).toBe('Link session not found.')
            expect(apiError.problem).toStrictEqual(problem)
            expect(apiError.problem?.code).toBeUndefined()
            expect(apiError.message).not.toContain(wrongToken)
            expect(JSON.stringify(apiError.problem)).not.toContain(wrongToken)
        })
    })
})
