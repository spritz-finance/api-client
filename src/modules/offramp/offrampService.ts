import { SpritzClient } from '../../lib/client'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type OffRampRefundRequest = PathRequestBody<'/v1/off-ramps/{offRampId}/refund', 'post'>
export type OffRampRefundResponse = PathResponse<'/v1/off-ramps/{offRampId}/refund', 'post'>

export class OfframpService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    /**
     * Refund a failed off-ramp payment.
     *
     * Pass `{ method: 'credit' }` to return the funds to the user's Spritz balance, or
     * `{ method: 'account', accountId }` to reissue the payout to a different bank account.
     * Omit `accountId` to reuse the off-ramp's original destination account.
     *
     * Only failed Modern Treasury and Checkbook off-ramps can be refunded.
     */
    public async refund(offRampId: string, input: OffRampRefundRequest) {
        return this.client.restApi<OffRampRefundResponse, OffRampRefundRequest>({
            method: 'post',
            path: `/v1/off-ramps/${encodeURIComponent(offRampId)}/refund`,
            body: input,
        })
    }
}
