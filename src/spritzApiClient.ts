import { AccountsService } from './accounts/accountsService'
import { Environment } from './env'
import { GraphClient } from './lib/client'

export class SpritzApiClient {
    private client: GraphClient
    public accounts: AccountsService

    public static initialize(environment: Environment) {
        const client = new SpritzApiClient()
        client.init(environment)
        return client
    }

    private init(environment: Environment) {
        this.client = new GraphClient(environment)
        this.accounts = new AccountsService(this.client)
    }
}
