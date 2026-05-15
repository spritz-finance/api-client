import { SpritzClient } from '../../lib/client'
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
        return this.client.restApi<BankAccountList>({
            method: 'get',
            path: '/v1/bank-accounts/',
        })
    }

    public async get(accountId: string) {
        return this.client.restApi<BankAccount>({
            method: 'get',
            path: `/v1/bank-accounts/${encodeURIComponent(accountId)}`,
        })
    }

    public async create(input: CreateBankAccountInput) {
        return this.client.restApi<CreateBankAccountResponse, CreateBankAccountInput>({
            method: 'post',
            path: '/v1/bank-accounts/',
            body: input,
        })
    }

    public async delete(accountId: string) {
        return this.client.restApi<DeleteBankAccountResponse>({
            method: 'delete',
            path: `/v1/bank-accounts/${encodeURIComponent(accountId)}`,
        })
    }

    public async createLinkToken(input?: CreateLinkTokenRequest) {
        return this.client.restApi<LinkTokenResponse, CreateLinkTokenRequest>({
            method: 'post',
            path: '/v1/bank-accounts/link-token',
            body: input,
        })
    }

    public async completeLinking(input: CompleteLinkingRequest) {
        return this.client.restApi<CompleteLinkingResponse, CompleteLinkingRequest>({
            method: 'post',
            path: '/v1/bank-accounts/link-complete',
            body: input,
        })
    }
}
