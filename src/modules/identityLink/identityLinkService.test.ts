import { describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { IdentityLinkService, linkTokenFromAuthorizationUrl } from './identityLinkService'

// 43 url-safe characters like a real link token, but not one.
const LINK_TOKEN = 'Ab3dEf9hIjKlMnOpQrStUvWxYz0123456789-_abcde'
const SESSION_ID = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b'
const AUTHORIZATION_URL = `https://flows-staging.spritz.finance/link/${SESSION_ID}#link_token=${LINK_TOKEN}`

function service(usesIntegratorAuth = true) {
    const client = {
        restApi: vi.fn().mockResolvedValue({}),
        request: vi.fn(),
        usesIntegratorAuth,
    } as unknown as SpritzClient
    return { client, identityLink: new IdentityLinkService(client) }
}

function firstCall(client: SpritzClient) {
    const [call] = vi.mocked(client.restApi).mock.calls
    return call?.[0] as { method: string; path: string; body?: unknown }
}

describe('IdentityLinkService', () => {
    describe('createSession', () => {
        it('starts a session for the authenticated account with the redirect and state', async () => {
            const { client, identityLink } = service()
            const session = {
                sessionId: SESSION_ID,
                authorizationUrl: AUTHORIZATION_URL,
                expiresAt: '2026-10-09T12:15:00.000Z',
            }
            vi.mocked(client.restApi).mockResolvedValue(session)

            await expect(
                identityLink.createSession({
                    redirectUri: 'https://partner.example/spritz/link/callback',
                    state: 'attempt-1',
                })
            ).resolves.toEqual(session)

            expect(client.restApi).toHaveBeenCalledWith({
                method: 'post',
                path: '/v1/users/me/identity-link-sessions',
                body: {
                    redirectUri: 'https://partner.example/spritz/link/callback',
                    state: 'attempt-1',
                },
            })
            expect(client.request).not.toHaveBeenCalled()
        })

        it('sends only the documented fields', async () => {
            const { client, identityLink } = service()

            await identityLink.createSession({
                redirectUri: 'https://partner.example/cb',
                state: 'attempt-2',
                // Extra properties a caller slips in must not reach the wire.
                ...({ email: 'jane@example.com' } as object),
            })

            expect(firstCall(client).body).toEqual({
                redirectUri: 'https://partner.example/cb',
                state: 'attempt-2',
            })
        })

        it('refuses to run without integrator credentials', async () => {
            const { client, identityLink } = service(false)

            await expect(
                identityLink.createSession({ redirectUri: 'https://p.example/cb', state: 's' })
            ).rejects.toThrow('integrator credentials')
            expect(client.restApi).not.toHaveBeenCalled()
        })
    })

    describe('get', () => {
        it('reads the status with the link token in the body, never in the URL', async () => {
            const { client, identityLink } = service()
            const status = { status: 'compared', comparison: 'passed' }
            vi.mocked(client.restApi).mockResolvedValue(status)

            await expect(
                identityLink.get({ sessionId: SESSION_ID, linkToken: LINK_TOKEN })
            ).resolves.toEqual(status)

            expect(client.restApi).toHaveBeenCalledWith({
                method: 'post',
                path: `/v1/link/sessions/${SESSION_ID}/status`,
                body: { linkToken: LINK_TOKEN },
            })
            expect(firstCall(client).path).not.toContain(LINK_TOKEN)
        })

        it('encodes the session id into the path', async () => {
            const { client, identityLink } = service()

            await identityLink.get({ sessionId: 'a/b?c', linkToken: LINK_TOKEN })

            expect(firstCall(client).path).toBe('/v1/link/sessions/a%2Fb%3Fc/status')
        })

        it('refuses to call without a session id or a link token', async () => {
            const { client, identityLink } = service()

            await expect(
                identityLink.get({ sessionId: '', linkToken: LINK_TOKEN })
            ).rejects.toThrow('sessionId')
            await expect(
                identityLink.get({ sessionId: SESSION_ID, linkToken: '' })
            ).rejects.toThrow('link token')
            expect(client.restApi).not.toHaveBeenCalled()
        })

        it('needs no integrator credentials: the link token is the credential', async () => {
            const { client, identityLink } = service(false)

            await identityLink.get({ sessionId: SESSION_ID, linkToken: LINK_TOKEN })

            expect(client.restApi).toHaveBeenCalledTimes(1)
        })
    })
})

describe('linkTokenFromAuthorizationUrl', () => {
    it('reads the token from the fragment', () => {
        expect(linkTokenFromAuthorizationUrl(AUTHORIZATION_URL)).toBe(LINK_TOKEN)
    })

    it('reads the token when the fragment carries other parameters too', () => {
        const url = `https://flows.spritz.finance/link/${SESSION_ID}#foo=bar&link_token=${LINK_TOKEN}`

        expect(linkTokenFromAuthorizationUrl(url)).toBe(LINK_TOKEN)
    })

    it('does not honour a token placed in the query string', () => {
        const url = `https://flows.spritz.finance/link/${SESSION_ID}?link_token=${LINK_TOKEN}`

        expect(() => linkTokenFromAuthorizationUrl(url)).toThrow('no link_token')
    })

    it('throws without echoing the URL when the fragment is missing', () => {
        const url = 'https://flows.spritz.finance/link/session-path-marker'
        let message = ''
        try {
            linkTokenFromAuthorizationUrl(url)
        } catch (error) {
            message = (error as Error).message
        }

        expect(message).toBe('authorizationUrl carries no link_token fragment')
        expect(message).not.toContain('session-path-marker')
    })

    it('rejects a value that is not a URL', () => {
        expect(() => linkTokenFromAuthorizationUrl('not a url')).toThrow('not a valid URL')
    })
})
