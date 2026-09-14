import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathResponse } from '../../rest/types'

export type VerificationSession = PathResponse<'/v1/users/me/verification-sessions/', 'post'>

export class VerificationService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    /**
     * Create or resume the authenticated user's identity verification session.
     *
     * Returns the provider (`persona` or `plaid`) with an embedded-flow `sessionToken`
     * and/or a hosted `verificationUrl`. Both may expire, so call this just in time
     * rather than caching the result.
     *
     * Throws a `ConflictError` (409) when verification is under review or unavailable, and an
     * `InternalServerError` with status 503 when the provider is temporarily unavailable (the
     * problem body carries `retryAfter`).
     */
    public async createSession() {
        return this.client.restApi(restRoute('/v1/users/me/verification-sessions/', 'post'))
    }
}
