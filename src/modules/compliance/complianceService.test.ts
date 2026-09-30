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
})
