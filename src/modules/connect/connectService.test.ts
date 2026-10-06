import { describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { ConnectService } from './connectService'

function service(usesIntegratorAuth = true) {
    const client = {
        restApi: vi.fn().mockResolvedValue({}),
        request: vi.fn(),
        usesIntegratorAuth,
    } as unknown as SpritzClient
    return { client, connect: new ConnectService(client) }
}

describe('ConnectService', () => {
    it('creates a session bound to the email that already has an account', async () => {
        const { client, connect } = service()

        await connect.createSession({
            redirectUri: 'https://partner.example/spritz/callback',
            state: 'attempt-1',
            email: 'jane@example.com',
        })

        expect(client.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/integrator/connect/sessions',
            body: {
                redirectUri: 'https://partner.example/spritz/callback',
                state: 'attempt-1',
                email: 'jane@example.com',
            },
        })
    })

    it('omits optional fields that were not given', async () => {
        const { client, connect } = service()

        await connect.createSession({ redirectUri: 'https://partner.example/cb' })

        expect(client.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/integrator/connect/sessions',
            body: { redirectUri: 'https://partner.example/cb' },
        })
    })

    it('exchanges an authorization code for the user API key', async () => {
        const { client, connect } = service()
        const exchanged = {
            apiKey: 'ak_test',
            userId: 'usr_1',
            email: 'jane@example.com',
            grantId: 'grant_1',
            tokenId: 'tok_1',
            keyPrefix: 'ak_tes',
        }
        vi.mocked(client.restApi).mockResolvedValue(exchanged)

        await expect(connect.exchangeCode('code_1')).resolves.toEqual(exchanged)
        expect(client.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/integrator/connect/token',
            body: { code: 'code_1' },
        })
    })

    it('refuses to run without integrator credentials', async () => {
        const { client, connect } = service(false)

        await expect(
            connect.createSession({ redirectUri: 'https://p.example/cb' })
        ).rejects.toThrow('integrator credentials')
        await expect(connect.exchangeCode('code_1')).rejects.toThrow('integrator credentials')
        expect(client.restApi).not.toHaveBeenCalled()
    })
})
