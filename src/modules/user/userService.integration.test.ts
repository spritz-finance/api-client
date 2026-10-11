import { http, HttpResponse, type JsonBodyType } from 'msw'
import { describe, expect, it } from 'vitest'
import { Environment } from '../../env'
import { ConflictError, InternalServerError, hasProblemCode } from '../../lib/error'
import { SpritzApiClient } from '../../spritzApiClient'
import { server } from '../../test/setup'

const REST_URL = 'https://sandbox.spritz.finance/v1/integrator/users'
const LEGACY_URL = 'https://api-staging.spritz.finance/users/integration'
const INTEGRATION_KEY = 'ik_test_key'
const INTEGRATOR_SECRET = 'is_test_secret'

const ACCOUNT = { userId: '6aa831df18ffc49a16151fcf', email: 'jane@example.com', apiKey: 'ak_new' }

type Seen = { body?: string }

function capture(url: string, status: number, body: JsonBodyType): Seen {
    const seen: Seen = {}

    server.use(
        http.post(url, async ({ request }) => {
            seen.body = await request.text()
            return HttpResponse.json(body, { status })
        })
    )

    return seen
}

function conflict(code: string, retryable: boolean) {
    return {
        type: 'urn:problem-type:resource:conflict',
        title: 'Conflict',
        status: 409,
        detail: `Problem ${code}`,
        code,
        retryable,
    }
}

/**
 * Every conflict the create route documents, as the SDK sees it. The success
 * shape carries no discriminator between create and reuse, so the only thing
 * a caller can branch on is `problem.code`.
 */
const CONFLICTS: [code: string, retryable: boolean][] = [
    ['USER_DELETED', false],
    ['USER_SELECTION_REQUIRED', false],
    ['USER_ALREADY_EXISTS', false],
    ['USER_CREATE_IN_PROGRESS', true],
]

describe('UserService.create REST integration', () => {
    const client = SpritzApiClient.initialize({
        environment: Environment.Sandbox,
        integrationKey: INTEGRATION_KEY,
        integratorSecret: INTEGRATOR_SECRET,
    })

    it('returns the account and fresh key as-is, whether created or reused', async () => {
        const seen = capture(REST_URL, 200, ACCOUNT)

        const result = await client.user.create({ email: '  Jane@Example.com ' })

        // Normalization is the server's job: the email goes over the wire untouched.
        expect(seen.body).toBe('{"email":"  Jane@Example.com "}')
        expect(result).toStrictEqual(ACCOUNT)
    })

    it.each(CONFLICTS)(
        'surfaces %s as a ConflictError carrying the code',
        async (code, retryable) => {
            capture(REST_URL, 409, conflict(code, retryable))

            const error = await client.user
                .create({ email: 'jane@example.com' })
                .catch((e: unknown) => e)

            expect(error).toBeInstanceOf(ConflictError)
            expect(hasProblemCode(error, code)).toBe(true)
            expect((error as ConflictError).problem?.type).toBe(
                'urn:problem-type:resource:conflict'
            )
            expect((error as ConflictError).problem?.retryable).toBe(retryable)
        }
    )

    it('surfaces an authorization lookup outage as a retryable InternalServerError', async () => {
        capture(REST_URL, 503, {
            type: 'urn:problem-type:service-unavailable',
            title: 'Service Unavailable',
            status: 503,
            detail: 'Authorization lookup is temporarily unavailable. Retry shortly.',
            code: 'AUTHORIZATION_LOOKUP_UNAVAILABLE',
            retryable: true,
            retryAfter: 5,
        })

        const error = await client.user
            .create({ email: 'jane@example.com' })
            .catch((e: unknown) => e)

        expect(error).toBeInstanceOf(InternalServerError)
        expect((error as InternalServerError).status).toBe(503)
        expect(hasProblemCode(error, 'AUTHORIZATION_LOOKUP_UNAVAILABLE')).toBe(true)
        expect((error as InternalServerError).problem?.retryable).toBe(true)
        expect((error as InternalServerError).problem?.retryAfter).toBe(5)
    })
})

describe('UserService.create legacy route integration', () => {
    // No integrator secret: the SDK falls back to the deprecated Lambda route.
    const client = SpritzApiClient.initialize({
        environment: Environment.Sandbox,
        integrationKey: INTEGRATION_KEY,
    })

    it('returns the same success shape as the REST route', async () => {
        const seen = capture(LEGACY_URL, 200, ACCOUNT)

        const result = await client.user.create({ email: 'jane@example.com' })

        expect(seen.body).toBe('{"email":"jane@example.com"}')
        expect(result).toStrictEqual(ACCOUNT)
    })

    it.each(CONFLICTS)(
        'surfaces %s from the legacy error body with the same code',
        async (code) => {
            capture(LEGACY_URL, 409, { message: `Problem ${code}`, code })

            const error = await client.user
                .create({ email: 'jane@example.com' })
                .catch((e: unknown) => e)

            expect(error).toBeInstanceOf(ConflictError)
            expect(hasProblemCode(error, code)).toBe(true)
            expect((error as ConflictError).message).toBe(`Problem ${code}`)
        }
    )

    it('surfaces an authorization lookup outage with its code', async () => {
        capture(LEGACY_URL, 503, {
            message: 'Authorization lookup is temporarily unavailable. Retry shortly.',
            code: 'AUTHORIZATION_LOOKUP_UNAVAILABLE',
        })

        const error = await client.user
            .create({ email: 'jane@example.com' })
            .catch((e: unknown) => e)

        expect(error).toBeInstanceOf(InternalServerError)
        expect((error as InternalServerError).status).toBe(503)
        expect(hasProblemCode(error, 'AUTHORIZATION_LOOKUP_UNAVAILABLE')).toBe(true)
    })
})
