import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
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
        return this.client.restApi(restRoute('/v1/funding-sources/', 'get'))
    }

    public async get(fundingSourceId: string) {
        return this.client.restApi(
            restRoute('/v1/funding-sources/{fundingSourceId}', 'get', {
                params: { fundingSourceId },
            })
        )
    }

    public async getDepositLimits(fundingSourceId: string) {
        return this.client.restApi(
            restRoute('/v1/funding-sources/{fundingSourceId}/deposit-limits', 'get', {
                params: { fundingSourceId },
            })
        )
    }
}
