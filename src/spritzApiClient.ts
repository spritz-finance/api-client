import { AccountsService } from './accounts/accountsService'
import { Environment } from './env'
import { GraphClient } from './lib/client'
import { UserService } from './modules/user/userService'

export class SpritzApiClient {
    private client: GraphClient
    public accounts: AccountsService
    public user: UserService

    public static initialize(environment: Environment, apiKey: string) {
        const client = new SpritzApiClient()
        client.init(environment, apiKey)
        return client
    }

    private init(environment: Environment, apiKey: string) {
        this.client = new GraphClient(environment, apiKey)
        this.accounts = new AccountsService(this.client)
        this.user = new UserService(this.client)
    }
}
