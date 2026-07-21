import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { OfframpService } from './offrampService'

describe('OfframpService', () => {
    let offrampService: OfframpService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        offrampService = new OfframpService(mockClient)
    })

    it('refunds an off-ramp to a different bank account', async () => {
        const response = { id: 'offramp_123', status: 'refunded' }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await offrampService.refund('offramp_123', {
            method: 'account',
            accountId: '6a5f75585a936eb477232f05',
        })

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/off-ramps/offramp_123/refund',
            body: { method: 'account', accountId: '6a5f75585a936eb477232f05' },
        })
        expect(result).toEqual(response)
    })

    it('refunds to the original destination account when accountId is omitted', async () => {
        vi.mocked(mockClient.restApi).mockResolvedValue({})

        await offrampService.refund('offramp_123', { method: 'account' })

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/off-ramps/offramp_123/refund',
            body: { method: 'account' },
        })
    })

    it('refunds an off-ramp as credit to the Spritz balance', async () => {
        vi.mocked(mockClient.restApi).mockResolvedValue({})

        await offrampService.refund('offramp_123', { method: 'credit' })

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/off-ramps/offramp_123/refund',
            body: { method: 'credit' },
        })
    })

    it('URL-encodes the off-ramp ID', async () => {
        vi.mocked(mockClient.restApi).mockResolvedValue({})

        await offrampService.refund('offramp_123/with space', { method: 'credit' })

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/off-ramps/offramp_123%2Fwith%20space/refund',
            body: { method: 'credit' },
        })
    })
})
