import { Environment } from './env'
import { GraphClient } from './lib/client'
import { BankAccountService } from './modules/bankAccount/bankAccountService'
import { PaymentService } from './modules/payment/paymentService'
import { PaymentRequestService } from './modules/paymentRequest/paymentRequestService'
import { UserService } from './modules/user/userService'

type ClientParams = { environment: Environment; apiKey: string; integrationKey?: string }
export class SpritzApiClient {
    private client: GraphClient
    public user: UserService
    public bankAccount: BankAccountService
    public paymentRequest: PaymentRequestService
    public payment: PaymentService

    constructor(
        private apiKey: string,
        private integrationKey: string,
        private environment: Environment
    ) {}

    public static initialize({ environment, apiKey = '', integrationKey = '' }: ClientParams) {
        const client = new SpritzApiClient(apiKey, integrationKey!, environment)
        client.init()
        return client
    }

    private init() {
        this.client = new GraphClient(this.environment, this.apiKey, this.integrationKey)
        this.user = new UserService(this.client)
        this.bankAccount = new BankAccountService(this.client)
        this.paymentRequest = new PaymentRequestService(this.client)
        this.payment = new PaymentService(this.client)
    }

    setApiKey(_apiKey: string) {
        this.apiKey = _apiKey
        this.init()
        return this
    }
}
