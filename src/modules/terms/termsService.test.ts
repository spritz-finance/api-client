import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { TermsService } from './termsService'

describe('TermsService', () => {
    let termsService: TermsService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        termsService = new TermsService(mockClient)
    })

    it('accepts terms with the signed agreement id', async () => {
        const input = { agreementId: 'agr_123', sessionId: 'rdr_123' }
        const response = { termsAccepted: true }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await termsService.accept(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/users/me/terms',
            body: input,
        })
        expect(result).toEqual(response)
    })

    it('accepts terms without a session id', async () => {
        const input = { agreementId: 'agr_123' }
        const response = { termsAccepted: true }

        vi.mocked(mockClient.restApi).mockResolvedValue(response)

        const result = await termsService.accept(input)

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/users/me/terms',
            body: input,
        })
        expect(result).toEqual(response)
    })
})
