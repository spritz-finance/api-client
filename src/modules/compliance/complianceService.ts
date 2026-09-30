import { SpritzClient } from '../../lib/client'

export class ComplianceService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }
}
