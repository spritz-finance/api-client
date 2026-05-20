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
                code: 'R01',
            },
        }
        const response = {
            id: 'dep_123',
            status: 'authorized',
            returnCode: null,
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await sandboxService.createDepositWithReturn(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/sandbox/deposits/direct',
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
            clientContext: {
                sessionId: 'session_123',
            },
            returnSimulation: {
                code: 'R10',
            },
        }
        const response = {
            id: 'dep_123',
            status: 'authorized',
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await sandboxService.createDepositWithReturn(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/sandbox/deposits/direct',
            body: input,
        })
        expect(result).toEqual(response)
    })
})
