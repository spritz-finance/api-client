import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'

export type ComplianceRequirements = PathResponse<'/v1/users/me/compliance/requirements', 'get'>
export type ComplianceRequirementField = ComplianceRequirements['fields'][number]
export type SubmitComplianceRequest = PathRequestBody<'/v1/users/me/compliance', 'post'>
export type SubmitComplianceResponse = PathResponse<'/v1/users/me/compliance', 'post'>

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

    /**
     * Submit the regional compliance fields (`POST /v1/users/me/compliance`).
     *
     * All required fields must be supplied together: a partial submission is rejected
     * with field-level errors on `error.problem.errors` rather than being stored.
     * `placeOfBirth.country` and `nationalities` are ISO 3166-1 alpha-3 codes, and
     * `accountPurposeOther` is required when `accountPurpose` is `'other'`.
     *
     * `bridgeCustomerUpdated` is false when the user has not accepted the provider's
     * terms yet. The fields are stored and included when the customer is created, so
     * this is not a failure.
     */
    public async submit(input: SubmitComplianceRequest) {
        return this.client.restApi(
            restRoute('/v1/users/me/compliance', 'post', {
                body: input,
            })
        )
    }
}
