import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathResponse } from '../../rest/types'

export type IntegratorProfile = PathResponse<'/v1/integrator/', 'get'>

export class IntegratorService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    /**
     * Confirm the active integrator credentials without requiring an End User key.
     */
    public async getProfile() {
        return this.client.restApi(restRoute('/v1/integrator/', 'get'))
    }
}
