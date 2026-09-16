import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathQuery, PathRequestBody, PathResponse } from '../../rest/types'

export type PrepareDepositRequest = PathRequestBody<'/v1/deposits/direct/prepare', 'post'>
export type PrepareDepositResponse = PathResponse<'/v1/deposits/direct/prepare', 'post'>
export type CreateDepositRequest = PathRequestBody<'/v1/deposits/direct', 'post'>
export type Deposit = PathResponse<'/v1/deposits/{depositId}', 'get'>
export type DepositListResponse = PathResponse<'/v1/deposits/', 'get'>
export type DepositListQuery = PathQuery<'/v1/deposits/', 'get'>

/**
 * `idempotencyKey` is required by `POST /v1/deposits/direct`: persist one
 * unique key per deposit intent before calling `create`, and reuse the exact
 * same key and body to recover the original response after a timeout or lost
 * reply instead of authorizing a second debit.
 */
export type CreateDepositOptions = {
    idempotencyKey: string
}

export function idempotencyHeaders(options: CreateDepositOptions | undefined) {
    const key = options?.idempotencyKey
    if (typeof key !== 'string' || key.length === 0) {
        throw new Error('idempotencyKey is required to create a deposit')
    }
    return { 'idempotency-key': key }
}

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

    public async create(input: CreateDepositRequest, options: CreateDepositOptions) {
        return this.client.restApi(
            restRoute('/v1/deposits/direct', 'post', {
                body: input,
                headers: idempotencyHeaders(options),
            })
        )
    }

    /**
     * Lists the authenticated user's deposits, newest first.
     *
     * The endpoint is user-scoped: reconciling an integrator-wide backlog means
     * iterating your own user roster and authorizing each user's read. Page with
     * `cursor`, driven by `nextCursor`/`hasMore` on the response.
     */
    public async list(query?: DepositListQuery) {
        return this.client.restApi(restRoute('/v1/deposits/', 'get', query ? { query } : undefined))
    }

    public async get(depositId: string) {
        return this.client.restApi(
            restRoute('/v1/deposits/{depositId}', 'get', {
                params: { depositId },
            })
        )
    }
}
