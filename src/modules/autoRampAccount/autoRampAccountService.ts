import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type AutoRampAccountList = PathResponse<'/v1/auto-ramp-accounts/', 'get'>
export type AutoRampAccount = AutoRampAccountList[number]
export type CreateAutoRampAccountRequest = PathRequestBody<'/v1/auto-ramp-accounts/', 'post'>
export type AutoRampAccountEstimate = PathResponse<'/v1/auto-ramp-accounts/{id}/estimate', 'get'>

export class AutoRampAccountService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async list() {
        return this.client.restApi(restRoute('/v1/auto-ramp-accounts/', 'get'))
    }

    public async get(accountId: string) {
        return this.client.restApi(
            restRoute('/v1/auto-ramp-accounts/{id}', 'get', {
                params: { id: accountId },
            })
        )
    }

    /**
     * Create an auto-ramp account (`POST /v1/auto-ramp-accounts/`): a virtual bank
     * account in the user's name that converts fiat deposits to `token` and sends them
     * to `address` on `network`.
     *
     * Branch on `depositInstructions.type` in the response: `us` carries routing and
     * account numbers, `iban` carries the IBAN and BIC for SEPA. Confirm `status` is
     * `active` before telling a user to deposit.
     *
     * The address must be valid for the network, and the network/token pair must be
     * supported in the user's region; otherwise a `BadRequestError` (400) names the
     * `field` (`address` or `network`).
     *
     * **This endpoint does not support an idempotency key.** After a timeout or lost
     * reply, call `list()` and look for the account before creating it again.
     *
     * This is the REST replacement for the legacy GraphQL `virtualAccounts.create()`.
     */
    public async create(input: CreateAutoRampAccountRequest) {
        return this.client.restApi(
            restRoute('/v1/auto-ramp-accounts/', 'post', {
                body: input,
            })
        )
    }

    /**
     * Estimate what depositing `amount` into this account is expected to cost
     * (`GET /v1/auto-ramp-accounts/{id}/estimate`). `amount` is a decimal string in the
     * account's own currency, e.g. `'2525.00'`.
     *
     * An estimate, not a quote: no rate is locked. The fee is this account's, so do not
     * reuse an estimate across accounts. `fees.maximum` and `output.minimum` are omitted
     * until enough deposits have settled on the network; do not promise a user a
     * ceiling or a floor when they are absent.
     *
     * When no estimate can be produced, branch on `error.problem.code`:
     * `rate_unavailable` (503, transient: retry), `unsupported_currency_pair` (400,
     * permanent) or `exchange_rate_provider_error` (502).
     */
    public async estimate(accountId: string, amount: string) {
        return this.client.restApi(
            restRoute('/v1/auto-ramp-accounts/{id}/estimate', 'get', {
                params: { id: accountId },
                query: { amount },
            })
        )
    }
}
