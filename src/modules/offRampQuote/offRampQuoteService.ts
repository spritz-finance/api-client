import { SpritzClient } from '../../lib/client'

export class OffRampQuoteService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }
}
