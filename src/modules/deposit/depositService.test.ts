import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { DepositService, type PrepareDepositRequest } from './depositService'

describe('DepositService', () => {
    let depositService: DepositService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        depositService = new DepositService(mockClient)
    })

    it('prepares a direct ACH deposit quote', async () => {
        const input = {
            sourceId: 'fs_123',
            address: '9n4nbM75f5Ui33ZbPYXn59EwSb9Y1zdyu3x2b1f8jQRY',
            network: 'solana',
            asset: 'USDC',
            quoteType: 'exact_input',
            amountUsd: '100.00',
            priority: 'normal',
            feeSubsidy: {
                percentage: 50,
                maxAmountUsd: '5.00',
            },
        } as const
        const response = {
            preparationId: 'prep_123',
            kind: 'deposit_authorization',
            expiresAt: '2026-01-01T00:00:00Z',
            messageVersion: 'v1',
            message: 'Authorization text',
            summary: {
                quoteType: 'exact_input',
                requestedAmountUsd: '100.00',
                priority: 'normal',
                feeRateBps: 100,
                principalAmountUsd: '99.00',
                expectedAssetAmount: '99.00',
                grossFeeUsd: '1.00',
                feeSubsidyUsd: '0.50',
                userFeeUsd: '0.50',
                totalDebitAmountUsd: '100.00',
                feeSubsidy: {
                    percentage: 50,
                    percentageBps: 5000,
                    maxAmountUsd: '5.00',
                    appliedAmountUsd: '0.50',
                },
                network: 'solana',
                asset: 'USDC',
                assetAddress: 'usdc_asset',
                destinationAddress: input.address,
            },
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await depositService.prepare(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/deposits/direct/prepare',
            body: input,
        })
        expect(result).toEqual(response)
    })

    it('creates a direct ACH deposit from a preparation', async () => {
        const input = {
            preparationId: 'prep_123',
        }
        const response = {
            id: 'dep_123',
            sourceId: 'fs_123',
            destinationId: 'dd_123',
            status: 'authorized',
            debitStatus: 'authorized',
            releaseStatus: 'not_started',
            releaseDecisionMode: 'after_settlement',
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await depositService.create(input, { idempotencyKey: 'intent_123' })

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/deposits/direct',
            body: input,
            headers: { 'idempotency-key': 'intent_123' },
        })
        expect(result).toEqual(response)
    })

    it('forwards clientNetwork on prepare and surfaces the submissionToken', async () => {
        const input: PrepareDepositRequest = {
            sourceId: 'fs_123',
            address: '9n4nbM75f5Ui33ZbPYXn59EwSb9Y1zdyu3x2b1f8jQRY',
            network: 'solana',
            asset: 'USDC',
            quoteType: 'exact_input',
            amountUsd: '100.00',
            priority: 'normal',
            clientNetwork: { ipAddresses: ['1.1.1.1', '2606:4700:4700::1111'] },
        }
        const response = {
            preparationId: 'prep_123',
            kind: 'deposit_authorization',
            submissionToken: 'ach_submit_token_123',
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await depositService.prepare(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/deposits/direct/prepare',
            body: input,
        })
        expect(result.submissionToken).toBe('ach_submit_token_123')
    })

    it('sends clientIp on a backend create', async () => {
        const input = { preparationId: 'prep_123', clientIp: '1.1.1.1' }

        vi.mocked(mockClient.restApi).mockResolvedValue({ id: 'dep_123' })

        await depositService.create(input, { idempotencyKey: 'intent_123' })

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/deposits/direct',
            body: input,
            headers: { 'idempotency-key': 'intent_123' },
        })
    })

    it('lists deposits without a query', async () => {
        const response = { data: [], hasMore: false, nextCursor: null }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await depositService.list()

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/deposits/',
        })
        expect(result).toEqual(response)
    })

    it('lists deposits with the schema-defined paging query', async () => {
        const query = { limit: 25, cursor: 'next page' } as const
        const response = { data: [], hasMore: true, nextCursor: 'dep_cursor_2' }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await depositService.list(query)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/deposits/',
            query,
        })
        expect(result).toEqual(response)
    })

    it('gets a deposit and encodes the id as a single path segment', async () => {
        const response = { id: 'dep/one', status: 'authorized' }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await depositService.get('dep/one')

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/deposits/dep%2Fone',
        })
        expect(result).toEqual(response)
    })

    it('refuses to create a deposit without an idempotency key', async () => {
        await expect(
            depositService.create({ preparationId: 'prep_123' }, { idempotencyKey: '' } as {
                idempotencyKey: string
            })
        ).rejects.toThrow('idempotencyKey is required to create a deposit')
        await expect(
            depositService.create(
                { preparationId: 'prep_123' },
                undefined as unknown as { idempotencyKey: string }
            )
        ).rejects.toThrow('idempotencyKey is required to create a deposit')

        expect(mockClient.restApi).not.toHaveBeenCalled()
    })
})
