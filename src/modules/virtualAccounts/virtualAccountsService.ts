import { VirtualAccounts } from '../../graph/queries/__types__/VirtualAccounts'
import VirtualAccountsQuery from '../../graph/queries/virtualAccounts.graphql'
import { SpritzClient } from '../../lib/client'

export class VirtualAccountsService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async list() {
        const response = await this.client.query<VirtualAccounts>({
            query: VirtualAccountsQuery,
        })
        return response.virtualAccounts
    }
}
