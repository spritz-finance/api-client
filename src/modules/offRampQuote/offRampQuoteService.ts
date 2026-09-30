import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type CreateOffRampQuoteRequest = PathRequestBody<'/v1/off-ramp-quotes/', 'post'>
export type OffRampQuote = PathResponse<'/v1/off-ramp-quotes/', 'post'>

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
}
