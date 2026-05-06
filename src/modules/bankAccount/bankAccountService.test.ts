import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { BankAccountService } from './bankAccountService'

describe('BankAccountService ACH linking', () => {
    let bankAccountService: BankAccountService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        bankAccountService = new BankAccountService(mockClient)
    })

    it('creates a Plaid link token', async () => {
        const response = {
            linkToken: 'link-sandbox-123',
            hostedLinkUrl: 'https://plaid.example/link',
            expiration: '2026-01-01T00:00:00Z',
            requestId: 'req_123',
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await bankAccountService.createLinkToken()

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/bank-accounts/link-token',
        })
        expect(result).toEqual(response)
    })

    it('completes Plaid linking with selected account metadata', async () => {
        const input = {
            publicToken: 'public-sandbox-123',
            accountIds: ['plaid-account-123'],
            institutionId: 'ins_123',
            institutionName: 'Plaid Test Bank',
        }
        const response = {
            bankAccounts: [
                {
                    id: 'ba_123',
                    status: 'active',
                    accountHolderName: 'Test User',
                    institution: {
                        name: 'Plaid Test Bank',
                        logo: null,
                    },
                    supportedRails: ['ach_standard'],
                    label: 'Plaid Test Bank Checking',
                    createdAt: '2026-01-01T00:00:00Z',
                    fundingSourceId: 'fs_123',
                    type: 'us',
                    currency: 'USD',
                    accountNumberLast4: '6789',
                    routingNumberLast4: '0021',
                    accountSubtype: 'checking',
                },
            ],
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await bankAccountService.completeLinking(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/bank-accounts/link-complete',
            body: input,
        })
        expect(result).toEqual(response)
    })
})
