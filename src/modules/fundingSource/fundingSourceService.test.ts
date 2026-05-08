import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { FundingSourceService } from './fundingSourceService'

describe('FundingSourceService', () => {
    let fundingSourceService: FundingSourceService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        fundingSourceService = new FundingSourceService(mockClient)
    })

    it('lists funding sources', async () => {
        const sources = [
            {
                id: 'fs_123',
                bankAccountId: 'ba_123',
                institutionName: 'Test Bank',
                accountNumberLast4: '6789',
                accountType: 'checking',
                status: 'active',
                statusReason: null,
                ownershipMatchStatus: 'matched',
            },
        ]

        vi.mocked(mockClient.restApi).mockResolvedValue(sources)

        const result = await fundingSourceService.list()

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/funding-sources/',
        })
        expect(result).toEqual(sources)
    })

    it('gets a funding source by URL-encoded ID', async () => {
        const source = {
            id: 'fs_123/with space',
            bankAccountId: 'ba_123',
            institutionName: 'Test Bank',
            accountNumberLast4: '6789',
            accountType: 'checking',
            status: 'active',
            statusReason: null,
            ownershipMatchStatus: 'matched',
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(source)

        const result = await fundingSourceService.get('fs_123/with space')

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/funding-sources/fs_123%2Fwith%20space',
        })
        expect(result).toEqual(source)
    })

    it('gets deposit limits by URL-encoded funding source ID', async () => {
        const limits = {
            minimumDepositAmountUsd: '10.00',
            transactionLimitUsd: '500.00',
            dailyLimitUsd: '1500.00',
            dailyRemainingUsd: '1400.00',
            monthlyLimitUsd: '5000.00',
            monthlyRemainingUsd: '4900.00',
            unsettledDepositLimit: 1,
            unsettledDepositRemaining: 1,
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(limits)

        const result = await fundingSourceService.getDepositLimits('fs_123/with space')

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/funding-sources/fs_123%2Fwith%20space/deposit-limits',
        })
        expect(result).toEqual(limits)
    })
})
