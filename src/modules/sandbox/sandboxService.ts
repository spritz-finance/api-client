import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type BypassKycRequest = PathRequestBody<'/v1/sandbox/bypass-kyc', 'post'>
export type CreateDepositWithReturnRequest = PathRequestBody<'/v1/sandbox/deposits/direct', 'post'>
export type CreateDepositWithReturnResponse = PathResponse<'/v1/sandbox/deposits/direct', 'post'>
export type DeleteFundingSourceResponse = PathResponse<
    '/v1/sandbox/funding-sources/{fundingSourceId}',
    'delete'
>

export class SandboxService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    /**
     * Simulate KYC verification for testing purposes.
     * Only available in sandbox environments — returns 403 in production.
     */
    public async bypassKyc(options?: BypassKycRequest) {
        return this.client.restApi(
            restRoute('/v1/sandbox/bypass-kyc', 'post', {
                body: options ?? { country: 'US' },
            })
        )
    }

    /**
     * Create a deposit whose ACH debit is routed through a return-code-armed
     * receiving account. The deposit settles into the `returned` lifecycle with
     * the supplied NACHA `code` so end-to-end return handling can be tested.
     *
     * Only available in sandbox environments — returns 403 in production.
     */
    public async createDepositWithReturn(input: CreateDepositWithReturnRequest) {
        return this.client.restApi(
            restRoute('/v1/sandbox/deposits/direct', 'post', {
                body: input,
            })
        )
    }

    /**
     * Permanently remove an ACH debit funding source for the authenticated user.
     * Intended for resetting funding sources during integration testing.
     *
     * Only available in sandbox environments — returns 403 in production.
     */
    public async deleteFundingSource(fundingSourceId: string) {
        return this.client.restApi(
            restRoute('/v1/sandbox/funding-sources/{fundingSourceId}', 'delete', {
                params: { fundingSourceId },
            })
        )
    }
}
