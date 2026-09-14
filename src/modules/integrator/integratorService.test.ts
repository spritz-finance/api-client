import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { IntegratorService } from './integratorService'

describe('IntegratorService', () => {
    let integratorService: IntegratorService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient
        integratorService = new IntegratorService(mockClient)
    })

    it('gets the active integrator profile without an End User route', async () => {
        const profile = {
            id: 'int_abc123',
            integratorKey: 'int_abc123',
            name: 'Example Builder',
            email: 'developer@example.com',
            canSubsidizeUserFees: false,
            achDebitEnabled: false,
            billPayEnabled: false,
            createdAt: '2026-08-06T00:00:00.000Z',
        }
        vi.mocked(mockClient.restApi).mockResolvedValue(profile)

        await expect(integratorService.getProfile()).resolves.toEqual(profile)
        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/integrator/',
        })
    })
})
