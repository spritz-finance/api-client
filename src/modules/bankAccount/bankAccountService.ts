import BankAccountsQuery from '../../graph/queries/bankAccounts.graphql'
import { GraphClient } from '../../lib/client'
import { UserBankAccounts } from '../../graph/queries/__types__'

export class BankAccountsService {
    private client: GraphClient

    constructor(client: GraphClient) {
        this.client = client
    }

    public async list() {
        const response = await this.client.query<UserBankAccounts>({
            query: BankAccountsQuery,
        })

        return response?.userBankAccounts ?? null
    }
}
