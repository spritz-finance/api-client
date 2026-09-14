import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { VerificationService } from './verificationService'

describe('VerificationService', () => {
    let verificationService: VerificationService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        verificationService = new VerificationService(mockClient)
    })

    it('creates a verification session', async () => {
        const session = {
            sessionId: 'inq_2Q3x7k9m1n',
            provider: 'persona',
            sessionToken: 'session_token',
            verificationUrl: 'https://withpersona.com/verify?inquiry-id=inq_2Q3x7k9m1n',
            verificationUrlExpiresAt: '2026-01-01T00:00:00Z',
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(session)

        const result = await verificationService.createSession()

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/users/me/verification-sessions/',
        })
        expect(result).toEqual(session)
    })
})
