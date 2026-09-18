import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { SandboxService } from './sandboxService'

describe('SandboxService', () => {
    let sandboxService: SandboxService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        sandboxService = new SandboxService(mockClient)
    })

    it('bypasses KYC with the default US country', async () => {
        const response = { success: true }
        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await sandboxService.bypassKyc()

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/sandbox/bypass-kyc',
            body: { country: 'US' },
        })
        expect(result).toEqual(response)
    })

    it('bypasses KYC with explicit options', async () => {
        const input = {
            country: 'US',
            failed: true,
        }
        const response = { success: true }
        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await sandboxService.bypassKyc(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/sandbox/bypass-kyc',
            body: input,
        })
        expect(result).toEqual(response)
    })

    it('creates a direct deposit with an armed ACH return simulation', async () => {
        const input = {
            preparationId: 'prep_123',
            returnSimulation: {
                code: 'R01' as const,
            },
        }
        const response = {
            id: 'dep_123',
            status: 'authorized',
            returnCode: null,
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await sandboxService.createDepositWithReturn(input, {
            idempotencyKey: 'intent_123',
        })

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/sandbox/deposits/direct',
            body: input,
            headers: { 'idempotency-key': 'intent_123' },
        })
        expect(result).toEqual(response)
    })

    it('prepares a deposit with a program-control simulation', async () => {
        const input = {
            sourceId: 'fs_123',
            address: '9n4nbM75f5Ui33ZbPYXn59EwSb9Y1zdyu3x2b1f8jQRY',
            network: 'solana' as const,
            asset: 'USDC' as const,
            quoteType: 'exact_input' as const,
            amountUsd: '100.00',
            priority: 'normal' as const,
            programControlSimulation: {
                state: 'halted' as const,
            },
        }
        const response = { preparationId: 'prep_123' }
        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await sandboxService.prepareDepositWithProgramControl(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/sandbox/deposits/direct/prepare',
            body: input,
        })
        expect(result).toEqual(response)
    })

    it('reads ACH debit exposure', async () => {
        const response = {
            aggregateCapW2Usd: '1000.00',
            aggregateCapW1Usd: '500.00',
            openExposureW2Usd: '250.00',
            openExposureW1Usd: '100.00',
            committedExposureW1Usd: '50.00',
        }
        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await sandboxService.getAchDebitExposure()

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/sandbox/ach-debit/exposure',
        })
        expect(result).toEqual(response)
    })

    it('sets ACH debit exposure caps', async () => {
        const input = {
            aggregateCapW2Usd: '1000.00',
            aggregateCapW1Usd: '500.00',
        }
        const response = input
        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await sandboxService.setAchDebitExposureCap(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/sandbox/ach-debit/exposure/cap',
            body: input,
        })
        expect(result).toEqual(response)
    })

    it('links a deterministic sandbox bank account', async () => {
        const input = {
            simulation: {
                code: 'ownership_matched' as const,
                account: 'primary' as const,
            },
        }
        const response = { bankAccounts: [] }
        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await sandboxService.linkBankAccount(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/sandbox/bank-accounts/link',
            body: input,
        })
        expect(result).toEqual(response)
    })

    it('deletes a funding source by id', async () => {
        const response = { id: 'fs_123', deleted: true }
        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await sandboxService.deleteFundingSource('fs_123')

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'delete',
            path: '/v1/sandbox/funding-sources/fs_123',
        })
        expect(result).toEqual(response)
    })

    it('encodes funding source ids with reserved characters', async () => {
        const response = { id: 'fs_123', deleted: true }
        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        await sandboxService.deleteFundingSource('fs_123/with space')

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'delete',
            path: '/v1/sandbox/funding-sources/fs_123%2Fwith%20space',
        })
    })

    it('passes through additional generated sandbox return fields without inventing Signal fields', async () => {
        const input = {
            preparationId: 'prep_123',
            returnSimulation: {
                code: 'R10' as const,
            },
        }
        const response = {
            id: 'dep_123',
            status: 'authorized',
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await sandboxService.createDepositWithReturn(input, {
            idempotencyKey: 'intent_123',
        })

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/sandbox/deposits/direct',
            body: input,
            headers: { 'idempotency-key': 'intent_123' },
        })
        expect(result).toEqual(response)
    })
})
