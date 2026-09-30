import { SpritzClient } from '../../lib/client'

export class TermsService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }
}
