import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { AchDebitService } from './achDebitService'

describe('AchDebitService', () => {
    let achDebitService: AchDebitService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        achDebitService = new AchDebitService(mockClient)
    })

    it('posts the email to the eligibility route', async () => {
        vi.mocked(mockClient.restApi).mockResolvedValue({ eligible: true })

        const result = await achDebitService.checkEligibility({ email: 'user@example.com' })

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/ach-debit/eligibility',
            body: { email: 'user@example.com' },
        })
        expect(result).toEqual({ eligible: true })
    })

    it('returns an ineligible verdict unchanged', async () => {
        vi.mocked(mockClient.restApi).mockResolvedValue({ eligible: false })

        const result = await achDebitService.checkEligibility({ email: 'other@example.com' })

        expect(result).toStrictEqual({ eligible: false })
    })
})
