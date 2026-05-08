import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { DepositService } from './depositService'

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
            clientContext: {
                sessionId: 'session_123',
                platform: 'ios',
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
            clientContext: {
                userAgent: 'test-agent',
            },
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

        const result = await depositService.create(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/deposits/direct',
            body: input,
        })
        expect(result).toEqual(response)
    })
})
