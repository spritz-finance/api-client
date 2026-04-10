import { SpritzClient } from '../../lib/client'
import type { PathRequestBody } from '../../rest/types'

export type BypassKycRequest = PathRequestBody<'/v1/sandbox/bypass-kyc', 'post'>

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
}
