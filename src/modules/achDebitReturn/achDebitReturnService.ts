import { SpritzClient } from '../../lib/client'
import type { PathQuery, PathResponse } from '../../rest/types'

export type AchDebitReturnListResponse = PathResponse<'/v1/integrator/ach-debit/returns', 'get'>
export type AchDebitReturn = AchDebitReturnListResponse['data'][number]
export type AchDebitReturnListQuery = PathQuery<'/v1/integrator/ach-debit/returns', 'get'>

export class AchDebitReturnService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async list(query?: AchDebitReturnListQuery) {
        return this.client.restApi<AchDebitReturnListResponse>({
            method: 'get',
            path: '/v1/integrator/ach-debit/returns',
            query: query as Record<string, string | number | boolean | undefined>,
        })
    }

    public async get(returnId: string) {
        return this.client.restApi<AchDebitReturn>({
            method: 'get',
            path: `/v1/integrator/ach-debit/returns/${encodeURIComponent(returnId)}`,
        })
    }
}
