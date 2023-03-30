import { GraphClient } from '../lib/client'

export class AccountsService {
    private client: GraphClient

    constructor(client: GraphClient) {
        this.client = client
    }
}
