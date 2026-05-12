import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { BankAccountService } from './bankAccountService'

describe('BankAccountService', () => {
    let bankAccountService: BankAccountService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        bankAccountService = new BankAccountService(mockClient)
    })

    it('lists bank accounts', async () => {
        const accounts = [
            {
                id: 'ba_123',
                status: 'active',
                accountHolderName: 'Test User',
                institution: { name: 'Plaid Test Bank', logo: null },
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
        ]

        vi.mocked(mockClient.restApi).mockResolvedValue(accounts)

        const result = await bankAccountService.list()

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/bank-accounts/',
        })
        expect(result).toEqual(accounts)
    })

    it('gets a bank account by URL-encoded ID', async () => {
        const account = {
            id: 'ba_123/with space',
            status: 'active',
            accountHolderName: 'Test User',
            supportedRails: ['ach_standard'],
            createdAt: '2026-01-01T00:00:00Z',
            fundingSourceId: null,
            type: 'us',
            currency: 'USD',
            accountNumberLast4: '6789',
            routingNumberLast4: '0021',
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(account)

        const result = await bankAccountService.get('ba_123/with space')

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/bank-accounts/ba_123%2Fwith%20space',
        })
        expect(result).toEqual(account)
    })

    it('creates a US bank account', async () => {
        const input = {
            type: 'us' as const,
            ownership: 'personal' as const,
            routingNumber: '021000021',
            accountNumber: '123456789',
            accountSubtype: 'checking' as const,
            label: 'Primary Checking',
        }
        const response = {
            id: 'ba_456',
            status: 'pending',
            accountHolderName: 'Test User',
            supportedRails: ['ach_standard'],
            createdAt: '2026-01-01T00:00:00Z',
            fundingSourceId: null,
            type: 'us',
            currency: 'USD',
            accountNumberLast4: '6789',
            routingNumberLast4: '0021',
            accountSubtype: 'checking',
            label: 'Primary Checking',
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await bankAccountService.create(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/bank-accounts/',
            body: input,
        })
        expect(result).toEqual(response)
    })

    it('deletes a bank account by URL-encoded ID', async () => {
        const response = { id: 'ba_123', deleted: true as const }
        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await bankAccountService.delete('ba_123/with space')

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'delete',
            path: '/v1/bank-accounts/ba_123%2Fwith%20space',
        })
        expect(result).toEqual(response)
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
                    institution: { name: 'Plaid Test Bank', logo: null },
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
