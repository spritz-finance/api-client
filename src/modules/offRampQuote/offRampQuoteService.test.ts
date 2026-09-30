import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { OffRampQuoteService } from './offRampQuoteService'

const QUOTE = {
    id: '6a99b7bacc18094dfe644ba6',
    fulfillment: 'sign_transaction',
    status: 'created',
    createdAt: '2026-09-29T08:12:57.968Z',
    input: {
        amount: '101.50',
        currency: 'USD',
        tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        chain: 'base',
    },
    output: {
        amount: '92.24',
        currency: 'EUR',
        rail: 'sepa',
        accountId: '6ab38a093ae8393c020db780',
        estimated: true,
        exchangeRate: { baseCurrency: 'USD', quoteCurrency: 'EUR', rate: '0.92010309' },
    },
    fees: { amount: '1.25', currency: 'USD' },
    sendTo: null,
    confirmation: null,
    offRampId: null,
}

describe('OffRampQuoteService', () => {
    let offRampQuoteService: OffRampQuoteService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        offRampQuoteService = new OffRampQuoteService(mockClient)
    })

    it('creates an off-ramp quote', async () => {
        const input = {
            accountId: '6ab38a093ae8393c020db780',
            amount: '101.50',
            amountMode: 'input' as const,
            rail: 'sepa' as const,
            chain: 'base' as const,
            tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(QUOTE)

        const result = await offRampQuoteService.create(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/off-ramp-quotes/',
            body: input,
        })
        expect(result).toEqual(QUOTE)
    })
})
