import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { AchDebitReturnService } from './achDebitReturnService'

describe('AchDebitReturnService', () => {
    let achDebitReturnService: AchDebitReturnService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        achDebitReturnService = new AchDebitReturnService(mockClient)
    })

    it('lists ACH debit returns with filters', async () => {
        const query = {
            limit: 50,
            cursor: 'cursor_123',
            userId: 'user_123',
            userIds: 'user_123,user_456',
            search: 'R01',
            returnCode: 'R01',
            returnBucket: 'administrative',
            cryptoStateAtReturn: 'fully_confirmed',
            lossOnly: 'true',
            userAction: 'review_required',
            occurredAfter: '2026-01-01T00:00:00Z',
            occurredBefore: '2026-02-01T00:00:00Z',
        } as const
        const response = {
            data: [],
            hasMore: false,
            nextCursor: null,
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await achDebitReturnService.list(query)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/integrator/ach-debit/returns',
            query,
        })
        expect(result).toEqual(response)
    })

    it('gets an ACH debit return by URL-encoded ID', async () => {
        const response = {
            id: 'dr_123',
            depositId: 'dep_123',
            userId: 'user_123',
            sourceId: 'fs_123',
            onRampId: 'onramp_123',
            amountUsd: '100.00',
            currency: 'USD',
            returnCode: 'R01',
            returnReason: 'Insufficient funds',
            occurredAt: '2026-01-01T00:00:00Z',
            cryptoStateAtReturn: 'fully_confirmed',
            lossAmountUsd: '100.00',
            atRiskAmountUsd: '0.00',
            sourceAction: 'disabled',
            userAction: 'none',
            reportingBucket: 'administrative',
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await achDebitReturnService.get('dr_123/with space')

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/integrator/ach-debit/returns/dr_123%2Fwith%20space',
        })
        expect(result).toEqual(response)
    })
})
