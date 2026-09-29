import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type CreateOffRampQuoteRequest = PathRequestBody<'/v1/off-ramp-quotes/', 'post'>
export type OffRampQuote = PathResponse<'/v1/off-ramp-quotes/', 'post'>
export type OffRampQuoteTransactionRequest = PathRequestBody<
    '/v1/off-ramp-quotes/{quoteId}/transaction',
    'post'
>
export type OffRampQuoteTransaction = PathResponse<
    '/v1/off-ramp-quotes/{quoteId}/transaction',
    'post'
>

export class OffRampQuoteService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    /**
     * Create a quote to convert crypto to fiat (`POST /v1/off-ramp-quotes/`).
     *
     * Check `fulfillment` on the response for the next step: `sign_transaction` means
     * call `getTransaction`, sign and broadcast; `send_to_address` means send exactly
     * `sendTo.amount` to `sendTo.address` before `sendTo.expiresAt`.
     *
     * `amountMode` defaults to `output`, which fixes the destination fiat amount. EUR
     * destinations require `input`: `amount` is then the exact USD value collected and
     * `output.amount` is an estimate (`output.estimated` is `true`).
     *
     * `tokenAddress` is optional in the type but required on every chain except
     * Bitcoin and Dash; a request without it is rejected with a 400.
     *
     * **This endpoint does not support an idempotency key.** A retry creates a second
     * quote. A quote that is never funded ends as `expired`.
     */
    public async create(input: CreateOffRampQuoteRequest) {
        return this.client.restApi(
            restRoute('/v1/off-ramp-quotes/', 'post', {
                body: input,
            })
        )
    }

    public async get(quoteId: string) {
        return this.client.restApi(
            restRoute('/v1/off-ramp-quotes/{quoteId}', 'get', {
                params: { quoteId },
            })
        )
    }

    /**
     * Get the transaction to sign for a `sign_transaction` quote
     * (`POST /v1/off-ramp-quotes/{quoteId}/transaction`).
     *
     * Branch on `type`: `evm` returns `contractAddress`, `calldata` and `value` to build the
     * transaction; `solana` and `sui` return a base64 `transactionSerialized` to sign as-is.
     * Nothing is stored: it only prepares the transaction.
     *
     * Solana and Sui transactions are built for `senderAddress`, so pass it on those chains.
     * `feePayer` is Solana only and defaults to `senderAddress`. The body is always sent,
     * as `{}` when `input` is omitted.
     *
     * Throws a `BadRequestError` (400) with problem code `sender_address_required` on a
     * Solana or Sui quote without `senderAddress`, and an `UnprocessableEntityError` (422)
     * on a `send_to_address` quote (Bitcoin, Dash, Tron), which has no transaction to sign.
     */
    public async getTransaction(quoteId: string, input: OffRampQuoteTransactionRequest = {}) {
        return this.client.restApi(
            restRoute('/v1/off-ramp-quotes/{quoteId}/transaction', 'post', {
                params: { quoteId },
                body: input,
            })
        )
    }
}
