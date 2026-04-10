import { SpritzClient } from '../../lib/client'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type PrepareDepositRequest = PathRequestBody<'/v1/deposits/prepare', 'post'>
export type PrepareDepositResponse = PathResponse<'/v1/deposits/prepare', 'post'>
export type CreateDepositRequest = PathRequestBody<'/v1/deposits/', 'post'>
export type Deposit = PathResponse<'/v1/deposits/', 'post'>

export class DepositService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async prepare(input: PrepareDepositRequest) {
        return this.client.restApi<PrepareDepositResponse, PrepareDepositRequest>({
            method: 'post',
            path: '/v1/deposits/prepare',
            body: input,
        })
    }

    public async create(input: CreateDepositRequest) {
        return this.client.restApi<Deposit, CreateDepositRequest>({
            method: 'post',
            path: '/v1/deposits/',
            body: input,
        })
    }
}
