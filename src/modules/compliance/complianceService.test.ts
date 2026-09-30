import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { ComplianceService } from './complianceService'

describe('ComplianceService', () => {
    let complianceService: ComplianceService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        complianceService = new ComplianceService(mockClient)
    })

    it('gets the regional compliance requirements', async () => {
        const requirements = {
            required: true,
            region: 'EEA',
            complete: false,
            deadline: '2026-06-15',
            fields: [
                { field: 'placeOfBirth', status: 'missing' },
                { field: 'nationalities', status: 'complete' },
            ],
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(requirements)

        const result = await complianceService.getRequirements()

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/users/me/compliance/requirements',
        })
        expect(result).toEqual(requirements)
    })

    it('submits the regional compliance fields', async () => {
        const input = {
            placeOfBirth: { country: 'DEU', city: 'Berlin' },
            nationalities: ['DEU'],
            accountPurpose: 'other' as const,
            accountPurposeOther: 'Paying contractors',
        }
        const response = { complianceFieldsComplete: true, bridgeCustomerUpdated: false }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await complianceService.submit(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/users/me/compliance',
            body: input,
        })
        expect(result).toEqual(response)
    })
})
