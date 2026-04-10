import { SpritzClient } from '../../lib/client'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type DepositDestination = PathResponse<'/v1/deposit-destinations/', 'get'>[number]
export type PrepareBindRequest = PathRequestBody<'/v1/deposit-destinations/prepare', 'post'>
export type PrepareBindResponse = PathResponse<'/v1/deposit-destinations/prepare', 'post'>
export type ConfirmBindRequest = PathRequestBody<'/v1/deposit-destinations/', 'post'>

export class DepositDestinationService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async list() {
        return this.client.restApi<PathResponse<'/v1/deposit-destinations/', 'get'>>({
            method: 'get',
            path: '/v1/deposit-destinations/',
        })
    }

    public async prepareBind(input: PrepareBindRequest) {
        return this.client.restApi<PrepareBindResponse, PrepareBindRequest>({
            method: 'post',
            path: '/v1/deposit-destinations/prepare',
            body: input,
        })
    }

    public async confirmBind(input: ConfirmBindRequest) {
        return this.client.restApi<DepositDestination, ConfirmBindRequest>({
            method: 'post',
            path: '/v1/deposit-destinations/',
            body: input,
        })
    }
}
