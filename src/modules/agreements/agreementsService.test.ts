import { http, HttpResponse } from 'msw'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { Environment } from '../../env'
import { NotFoundError, RateLimitError, hasProblemCode } from '../../lib/error'
import { SpritzApiClient } from '../../spritzApiClient'
import { server } from '../../test/setup'
import type {
    AgreementsPresentation,
    AgreementsReceipt,
    CreateAgreementsPresentationResponse,
} from './agreementsService'

const BASE = 'https://sandbox.spritz.finance'

const PRESENTATION = {
    presentationId: '7f1c2a9e-1b2c-4d5e-8f90-0a1b2c3d4e5f',
    statementKey: 'continueStatement',
    expiresAt: '2026-11-12T12:15:00.000Z',
    baseRevision: '0:1',
    copySha256: 'a'.repeat(64),
    submissionToken: 'agreements_submission_token',
    copy: {
        copyVersion: 'staging-test-1',
        language: 'en',
        continueStatement: 'By continuing, you agree to the Spritz Terms of Service.',
        updatedStatement: 'We updated our terms.',
        privacyOnlyStatement: 'We updated our privacy policy.',
        buttonLabel: 'Continue',
        supportEmail: 'support@spritz.finance',
        consentPattern: 'clickwrap',
        links: [
            {
                type: 'terms_of_service',
                label: 'Terms of Service',
                url: '/v1/agreements/documents/terms',
            },
        ],
    },
    items: [
        {
            type: 'terms_of_service',
            version: 'staging-test-1',
            action: 'accept',
            archivedUrl: '/v1/agreements/documents/terms',
            documentSha256: 'b'.repeat(64),
        },
    ],
} as const

const RECEIPT = {
    operationId: 'a71bafa8-0000-4000-8000-000000000000',
    presentationId: PRESENTATION.presentationId,
    revision: '1:1',
    occurredAt: '2026-11-12T12:01:00.000Z',
    eventIds: ['e1', 'e2', 'e3'],
    agreements: { status: 'accepted', revision: '1:1', items: [] },
} as const

function problem(status: number, code: string) {
    return HttpResponse.json(
        { type: 'about:blank', title: 'Refused', status, code },
        { status, headers: { 'content-type': 'application/problem+json' } }
    )
}

describe('AgreementsService', () => {
    const client = SpritzApiClient.initialize({
        environment: Environment.Sandbox,
        apiKey: 'ak_test_key',
        integrationKey: 'ik_test_key',
        integratorSecret: 'is_test_secret',
    })

    it('presents outstanding agreements with an empty body by default', async () => {
        const seen: { body?: unknown; auth?: string | null } = {}
        server.use(
            http.post(`${BASE}/v1/users/me/agreements/presentations`, async ({ request }) => {
                seen.body = await request.json()
                seen.auth = request.headers.get('authorization')
                return HttpResponse.json(PRESENTATION)
            })
        )

        const result = await client.agreements.present()

        expect(seen.body).toEqual({})
        expect(seen.auth).toBe('Bearer ak_test_key')
        expect(result).toEqual(PRESENTATION)
        expectTypeOf(result).toEqualTypeOf<CreateAgreementsPresentationResponse>()
    })

    it('passes a type filter and narrows on nothingToPresent', async () => {
        const seen: { body?: unknown } = {}
        server.use(
            http.post(`${BASE}/v1/users/me/agreements/presentations`, async ({ request }) => {
                seen.body = await request.json()
                return HttpResponse.json({ nothingToPresent: true })
            })
        )

        const result = await client.agreements.present({ types: ['terms_of_service'] })

        expect(seen.body).toEqual({ types: ['terms_of_service'] })
        expect('nothingToPresent' in result && result.nothingToPresent).toBe(true)
        if (!('nothingToPresent' in result)) {
            expectTypeOf(result).toEqualTypeOf<AgreementsPresentation>()
        }
    })

    it('surfaces the presentation rate limit as a coded RateLimitError', async () => {
        server.use(
            http.post(`${BASE}/v1/users/me/agreements/presentations`, () =>
                problem(429, 'agreement_presentation_rate_limited')
            )
        )

        const error = await client.agreements.present().catch((e: unknown) => e)

        expect(error).toBeInstanceOf(RateLimitError)
        expect(hasProblemCode(error, 'agreement_presentation_rate_limited')).toBe(true)
    })

    it('recovers a receipt by presentation id', async () => {
        server.use(
            http.get(`${BASE}/v1/users/me/agreements/operations/:presentationId`, ({ params }) => {
                expect(params.presentationId).toBe(PRESENTATION.presentationId)
                return HttpResponse.json(RECEIPT)
            })
        )

        const result = await client.agreements.getReceipt(PRESENTATION.presentationId)

        expect(result).toEqual(RECEIPT)
        expectTypeOf(result).toEqualTypeOf<AgreementsReceipt>()
    })

    it('throws NotFoundError when nothing was accepted for the presentation', async () => {
        server.use(
            http.get(`${BASE}/v1/users/me/agreements/operations/:presentationId`, () =>
                problem(404, 'presentation_not_found')
            )
        )

        await expect(client.agreements.getReceipt('missing')).rejects.toBeInstanceOf(NotFoundError)
    })
})
