import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'
import { idempotencyHeaders, type CreateDepositOptions } from '../deposit/depositService'

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
     * Like `deposit.create`, `POST /v1/sandbox/deposits/direct` requires an
     * `idempotency-key`; reuse the same key and body to replay after a timeout.
     *
     * Only available in sandbox environments — returns 403 in production.
     */
    public async createDepositWithReturn(
        input: CreateDepositWithReturnRequest,
        options: CreateDepositOptions
    ) {
        return this.client.restApi(
            restRoute('/v1/sandbox/deposits/direct', 'post', {
                body: input,
                headers: idempotencyHeaders(options),
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
