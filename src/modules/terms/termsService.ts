import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type AcceptTermsRequest = PathRequestBody<'/v1/users/me/terms', 'post'>
export type AcceptTermsResponse = PathResponse<'/v1/users/me/terms', 'post'>

export class TermsService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    /**
     * Record acceptance of the terms a capability requires (`POST /v1/users/me/terms`).
     *
     * `agreementId` is the signed agreement id the user obtained from the provider's
     * hosted flow, whose URL is the `actionUrl` of the outstanding `terms_acceptance`
     * requirement on `user.getMe()`. It is opaque: the platform resolves which provider
     * it belongs to.
     *
     * Branch on `termsAccepted`: it is `true` when the agreement was recorded and terms
     * are now accepted.
     *
     * **This endpoint does not accept an idempotency key.** If a request times out, call
     * `user.getMe()` and check whether the `terms_acceptance` requirement is still
     * outstanding before submitting again.
     *
     * This is the REST replacement for the legacy GraphQL `onramp.acceptTermsOfService()`.
     */
    public async accept(input: AcceptTermsRequest) {
        return this.client.restApi(
            restRoute('/v1/users/me/terms', 'post', {
                body: input,
            })
        )
    }
}
