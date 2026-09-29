import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathResponse } from '../../rest/types'

export type ComplianceRequirements = PathResponse<'/v1/users/me/compliance/requirements', 'get'>
export type ComplianceRequirementField = ComplianceRequirements['fields'][number]

export class ComplianceService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    /**
     * Fetch the additional compliance fields the authenticated user's region requires
     * (`GET /v1/users/me/compliance/requirements`).
     *
     * Users outside a regulated region get `required: false` with an empty `fields`
     * array. While `complete` is false, capabilities for the region are gated behind a
     * `regional_compliance` requirement on `user.getMe()`.
     */
    public async getRequirements() {
        return this.client.restApi(restRoute('/v1/users/me/compliance/requirements', 'get'))
    }
}
