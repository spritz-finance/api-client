import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type BankAccount = PathResponse<'/v1/bank-accounts/', 'get'>[number]
export type BankAccountList = PathResponse<'/v1/bank-accounts/', 'get'>
export type CreateBankAccountInput = PathRequestBody<'/v1/bank-accounts/', 'post'>
export type CreateBankAccountResponse = PathResponse<'/v1/bank-accounts/', 'post'>
export type DeleteBankAccountResponse = PathResponse<'/v1/bank-accounts/{accountId}', 'delete'>
export type LinkTokenResponse = PathResponse<'/v1/bank-accounts/link-token', 'post'>
export type CreateLinkTokenRequest = PathRequestBody<'/v1/bank-accounts/link-token', 'post'>
export type CompleteLinkingRequest = PathRequestBody<'/v1/bank-accounts/link-complete', 'post'>
export type CompleteLinkingResponse = PathResponse<'/v1/bank-accounts/link-complete', 'post'>

export class BankAccountService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async list() {
        return this.client.restApi(restRoute('/v1/bank-accounts/', 'get'))
    }

    public async get(accountId: string) {
        return this.client.restApi(
            restRoute('/v1/bank-accounts/{accountId}', 'get', {
                params: { accountId },
            })
        )
    }

    public async create(input: CreateBankAccountInput) {
        return this.client.restApi(
            restRoute('/v1/bank-accounts/', 'post', {
                body: input,
            })
        )
    }

    public async delete(accountId: string) {
        return this.client.restApi(
            restRoute('/v1/bank-accounts/{accountId}', 'delete', {
                params: { accountId },
            })
        )
    }

    public async createLinkToken(input?: CreateLinkTokenRequest) {
        return this.client.restApi(
            restRoute('/v1/bank-accounts/link-token', 'post', input ? { body: input } : undefined)
        )
    }

    public async completeLinking(input: CompleteLinkingRequest) {
        return this.client.restApi(
            restRoute('/v1/bank-accounts/link-complete', 'post', {
                body: input,
            })
        )
    }
}
