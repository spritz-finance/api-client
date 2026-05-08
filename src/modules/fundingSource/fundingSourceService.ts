import { SpritzClient } from '../../lib/client'
import type { PathResponse } from '../../rest/types'

export type FundingSource = PathResponse<'/v1/funding-sources/', 'get'>[number]
export type FundingSourceDepositLimits = PathResponse<
    '/v1/funding-sources/{fundingSourceId}/deposit-limits',
    'get'
>

export class FundingSourceService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async list() {
        return this.client.restApi<PathResponse<'/v1/funding-sources/', 'get'>>({
            method: 'get',
            path: '/v1/funding-sources/',
        })
    }

    public async get(fundingSourceId: string) {
        return this.client.restApi<PathResponse<'/v1/funding-sources/{fundingSourceId}', 'get'>>({
            method: 'get',
            path: `/v1/funding-sources/${encodeURIComponent(fundingSourceId)}`,
        })
    }

    public async getDepositLimits(fundingSourceId: string) {
        return this.client.restApi<FundingSourceDepositLimits>({
            method: 'get',
            path: `/v1/funding-sources/${encodeURIComponent(fundingSourceId)}/deposit-limits`,
        })
    }
}
