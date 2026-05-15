import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type PrepareDepositRequest = PathRequestBody<'/v1/deposits/direct/prepare', 'post'>
export type PrepareDepositResponse = PathResponse<'/v1/deposits/direct/prepare', 'post'>
export type CreateDepositRequest = PathRequestBody<'/v1/deposits/direct', 'post'>
export type Deposit = PathResponse<'/v1/deposits/direct', 'post'>

export class DepositService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async prepare(input: PrepareDepositRequest) {
        return this.client.restApi(
            restRoute('/v1/deposits/direct/prepare', 'post', {
                body: input,
            })
        )
    }

    public async create(input: CreateDepositRequest) {
        return this.client.restApi(
            restRoute('/v1/deposits/direct', 'post', {
                body: input,
            })
        )
    }
}
