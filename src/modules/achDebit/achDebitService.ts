import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type AchDebitEligibilityRequest = PathRequestBody<'/v1/ach-debit/eligibility', 'post'>
export type AchDebitEligibilityResponse = PathResponse<'/v1/ach-debit/eligibility', 'post'>

export class AchDebitService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    /**
     * Checks whether the bank deposit option can be offered for an email address.
     *
     * Call this before showing a bank deposit option to someone who is not yet a
     * Spritz user. The route authenticates as the integrator (HMAC) and takes no
     * user bearer key, because the address it asks about need not belong to an
     * existing user.
     *
     * Eligibility only ever moves in one direction: once an address is eligible
     * it stays eligible. `eligible: false` may be transient, so re-check rather
     * than caching it against the address.
     *
     * Once the user exists, this is no longer the right question to ask — the
     * capabilities on `GET /v1/users/me` become the source of truth.
     */
    public async checkEligibility(input: AchDebitEligibilityRequest) {
        return this.client.restApi(
            restRoute('/v1/ach-debit/eligibility', 'post', {
                body: input,
            })
        )
    }
}
