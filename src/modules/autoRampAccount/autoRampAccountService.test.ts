import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { AutoRampAccountService } from './autoRampAccountService'

const ACCOUNT = {
    id: '507f1f77bcf86cd799439011',
    depositInstructions: {
        type: 'iban',
        bankName: 'Example Bank',
        bankAddress: '1 Example Street, Berlin',
        paymentRails: ['sepa'],
        iban: 'DE89370400440532013000',
        bic: 'COBADEFFXXX',
    },
    network: 'solana',
    address: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
    token: 'USDC',
    currency: 'EUR',
    status: 'active',
    createdAt: '2026-09-30T10:30:00.000Z',
}

describe('AutoRampAccountService', () => {
    let autoRampAccountService: AutoRampAccountService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        autoRampAccountService = new AutoRampAccountService(mockClient)
    })

    it('lists auto-ramp accounts', async () => {
        vi.mocked(mockClient.restApi).mockResolvedValue([ACCOUNT])

        const result = await autoRampAccountService.list()

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/auto-ramp-accounts/',
        })
        expect(result).toEqual([ACCOUNT])
    })

    it('gets an auto-ramp account by URL-encoded ID', async () => {
        vi.mocked(mockClient.restApi).mockResolvedValue(ACCOUNT)

        const result = await autoRampAccountService.get('account_123/with space')

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/auto-ramp-accounts/account_123%2Fwith%20space',
        })
        expect(result).toEqual(ACCOUNT)
    })

    it('creates an auto-ramp account', async () => {
        const input = {
            address: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
            network: 'solana' as const,
            token: 'USDC',
        }
        vi.mocked(mockClient.restApi).mockResolvedValue(ACCOUNT)

        const result = await autoRampAccountService.create(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/auto-ramp-accounts/',
            body: input,
        })
        expect(result).toEqual(ACCOUNT)
    })

    it('estimates a deposit into an auto-ramp account', async () => {
        const estimate = {
            input: { amount: '2525.00', currency: 'EUR' },
            fees: {
                total: '12.63',
                currency: 'EUR',
                breakdown: { platform: '12.63', exchange: '0.00', network: '0.00' },
                estimated: ['network'],
                networkFeeSamples: 0,
            },
            output: {
                amount: '2735.41',
                token: 'USDC',
                network: 'solana',
                address: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
            },
            rate: { value: '1.0886', source: 'provider', asOf: '2026-09-30T10:30:00.000Z' },
        }
        vi.mocked(mockClient.restApi).mockResolvedValue(estimate)

        const result = await autoRampAccountService.estimate('account_123/with space', '2525.00')

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/auto-ramp-accounts/account_123%2Fwith%20space/estimate',
            query: { amount: '2525.00' },
        })
        expect(result).toEqual(estimate)
    })
})
