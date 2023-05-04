import { Environment } from './env'
import { GraphClient } from './lib/client'
import { BankAccountService } from './modules/bankAccount/bankAccountService'
import { PaymentRequestService } from './modules/paymentRequest/paymentRequestService'
import { UserService } from './modules/user/userService'

export class SpritzApiClient {
    private client: GraphClient
    public user: UserService
    public bankAccount: BankAccountService
    public paymentRequest: PaymentRequestService

    public static initialize(environment: Environment, apiKey: string) {
        const client = new SpritzApiClient()
        client.init(environment, apiKey)
        return client
    }

    private init(environment: Environment, apiKey: string) {
        this.client = new GraphClient(environment, apiKey)
        this.user = new UserService(this.client)
        this.bankAccount = new BankAccountService(this.client)
        this.paymentRequest = new PaymentRequestService(this.client)
    }
}
