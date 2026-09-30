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

    it('gets an off-ramp quote by URL-encoded ID', async () => {
        vi.mocked(mockClient.restApi).mockResolvedValue(QUOTE)

        const result = await offRampQuoteService.get('quote_123/with space')

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/off-ramp-quotes/quote_123%2Fwith%20space',
        })
        expect(result).toEqual(QUOTE)
    })

    it('gets transaction params for a sender and fee payer', async () => {
        const input = {
            senderAddress: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
            feePayer: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
        }
        const transaction = {
            type: 'solana',
            chain: 'solana',
            inputToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            outputToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            requiredTokenInput: '101500000',
            recipientAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
            transactionSerialized: 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        }
        vi.mocked(mockClient.restApi).mockResolvedValue(transaction)

        const result = await offRampQuoteService.getTransaction('quote_123/with space', input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/off-ramp-quotes/quote_123%2Fwith%20space/transaction',
            body: input,
        })
        expect(result).toEqual(transaction)
    })

    it('gets transaction params without a sender', async () => {
        const transaction = {
            type: 'evm',
            chain: 'base',
            inputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            outputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            requiredTokenInput: '101500000',
            contractAddress: '0xbF7Abc15f00a8C2d6b13A952c58d12b7c194A8D0',
            calldata: '0xd71d9632',
            method: 'payWithToken',
            value: null,
        }
        vi.mocked(mockClient.restApi).mockResolvedValue(transaction)

        const result = await offRampQuoteService.getTransaction(QUOTE.id)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: `/v1/off-ramp-quotes/${QUOTE.id}/transaction`,
            body: {},
        })
        expect(result).toEqual(transaction)
    })

    it('reports the broadcast transaction for a quote', async () => {
        const input = {
            transactionHash: '0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060',
        }
        const submitted = { ...QUOTE, status: 'transaction_pending' }
        vi.mocked(mockClient.restApi).mockResolvedValue(submitted)

        const result = await offRampQuoteService.submit('quote_123/with space', input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/off-ramp-quotes/quote_123%2Fwith%20space/submit',
            body: input,
        })
        expect(result).toEqual(submitted)
    })
})
