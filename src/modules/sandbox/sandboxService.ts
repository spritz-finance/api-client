import { SpritzClient } from '../../lib/client'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type BypassKycRequest = PathRequestBody<'/v1/sandbox/bypass-kyc', 'post'>
export type CreateDepositWithReturnRequest = PathRequestBody<'/v1/sandbox/deposits/direct', 'post'>
export type CreateDepositWithReturnResponse = PathResponse<'/v1/sandbox/deposits/direct', 'post'>

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
        return this.client.restApi({
            method: 'post',
            path: '/v1/sandbox/bypass-kyc',
            body: options ?? { country: 'US' },
        })
    }

    /**
     * Create a deposit whose ACH debit is routed through a return-code-armed
     * receiving account. The deposit settles into the `returned` lifecycle with
     * the supplied NACHA `code` so end-to-end return handling can be tested.
     *
     * Only available in sandbox environments — returns 403 in production.
     */
    public async createDepositWithReturn(input: CreateDepositWithReturnRequest) {
        return this.client.restApi<CreateDepositWithReturnResponse, CreateDepositWithReturnRequest>(
            {
                method: 'post',
                path: '/v1/sandbox/deposits/direct',
                body: input,
            }
        )
    }
}
