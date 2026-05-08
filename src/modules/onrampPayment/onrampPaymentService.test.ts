import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { OnrampPaymentService } from './onrampPaymentService'

describe('OnrampPaymentService', () => {
    let onrampPaymentService: OnrampPaymentService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        onrampPaymentService = new OnrampPaymentService(mockClient)
    })

    it('lists on-ramps with filters', async () => {
        const query = {
            network: 'solana',
            token: 'USDC',
            address: '9n4nbM75f5Ui33ZbPYXn59EwSb9Y1zdyu3x2b1f8jQRY',
            cursor: 'cursor_123',
            limit: 20,
            sort: 'desc',
        } as const
        const response = {
            data: [],
            hasMore: false,
            nextCursor: null,
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await onrampPaymentService.list(query)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/on-ramps/',
            query,
        })
        expect(result).toEqual(response)
    })

    it('gets an on-ramp by URL-encoded ID', async () => {
        const response = {
            id: 'onramp_123',
            status: 'processing',
            createdAt: '2026-01-01T00:00:00Z',
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await onrampPaymentService.get('onramp_123/with space')

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/on-ramps/onramp_123%2Fwith%20space',
        })
        expect(result).toEqual(response)
    })
})
