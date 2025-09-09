import { Environment } from './env'
import { SpritzClient } from './lib/client'
import { isRunningInBrowser } from './lib/util'
import { BankAccountService } from './modules/bankAccount/bankAccountService'
import { BillService } from './modules/bill/billService'
import { DebitCardService } from './modules/debitCard/debitCardService'
import { InstitutionService } from './modules/institution/institutionService'
import { OnrampPaymentService } from './modules/onrampPayment/onrampPaymentService'
import { OnrampService } from './modules/onramp/onrampService'
import { VirtualAccountsService } from './modules/virtualAccounts/virtualAccountsService'
import { PaymentService } from './modules/payment/paymentService'
import { PaymentRequestService } from './modules/paymentRequest/paymentRequestService'
import { UserService } from './modules/user/userService'
import { VirtualCardService } from './modules/virtualCard/virtualCardService'
import { WebhookService } from './modules/webhook/webhookService'

export type ClientOptions = {
    /**
     * Defaults to Environment.Sandbox.
     */
    environment?: Environment

    apiKey?: string

    integrationKey?: string

    /**
     * The client will wait up to a specified duration (in milliseconds)
     * for a response from the server before considering a single request as timed out.
     *
     * Please be aware that requests are automatically retried by default.
     * This means that in some situations, the actual wait time could exceed the set timeout
     * before the process is either completed or terminated.
     */
    timeout?: number

    /**
     * For security reasons, using this library on the client-side is not recommended
     * because it could potentially reveal your confidential Integrator Key.
     * Please enable this option to 'true' only if you're fully aware of the risks and
     * have implemented the necessary protective measures.
     */
    dangerouslyAllowBrowser?: boolean
}

export class SpritzApiClient {
    private environment: Environment
    private apiKey: string | undefined
    private integrationKey: string | undefined

    private client: SpritzClient
    public user: UserService
    public bankAccount: BankAccountService
    public debitCard: DebitCardService
    public paymentRequest: PaymentRequestService
    public payment: PaymentService
    public onrampPayment: OnrampPaymentService
    public onramp: OnrampService
    public virtualAccounts: VirtualAccountsService
    public virtualCard: VirtualCardService
    public bill: BillService
    public institution: InstitutionService
    public webhook: WebhookService

    constructor(
        environment: Environment,
        apiKey?: string,
        integrationKey?: string,
        dangerouslyAllowBrowser?: boolean
    ) {
        if (apiKey === undefined && integrationKey === undefined) {
            throw new Error(
                'The integrationKey or apiKey variable appears to be missing or empty. Please ensure you provide it, or when initializing the SpritzApiClient, opt for the integratorKey option.'
            )
        }
        this.environment = environment
        this.apiKey = apiKey
        this.integrationKey = integrationKey

        if (!dangerouslyAllowBrowser && isRunningInBrowser()) {
            throw new Error(
                "It seems you're operating within a browser environment.\n\nBy default, this is deactivated due to the potential risk of exposing your confidential integrator credentials.\nIf you're aware of these risks and have taken necessary security measures, you can enable the `dangerouslyAllowBrowser` option, e.g.,\n\nSpritzApiClient.initialize({ apiKey, dangerouslyAllowBrowser: true });\n"
            )
        }
    }

    public static initialize({
        environment = Environment.Sandbox,
        apiKey,
        integrationKey,
        dangerouslyAllowBrowser = false,
    }: ClientOptions) {
        const client = new SpritzApiClient(
            environment,
            apiKey,
            integrationKey,
            dangerouslyAllowBrowser
        )
        client.init()
        return client
    }

    private init() {
        this.client = new SpritzClient({
            environment: this.environment,
            apiKey: this.apiKey,
            integrationKey: this.integrationKey,
        })
        this.user = new UserService(this.client)
        this.bankAccount = new BankAccountService(this.client)
        this.debitCard = new DebitCardService(this.client)
        this.paymentRequest = new PaymentRequestService(this.client)
        this.payment = new PaymentService(this.client)
        this.onrampPayment = new OnrampPaymentService(this.client)
        this.onramp = new OnrampService(this.client)
        this.virtualAccounts = new VirtualAccountsService(this.client)
        this.virtualCard = new VirtualCardService(this.client)
        this.bill = new BillService(this.client)
        this.institution = new InstitutionService(this.client)
        this.webhook = new WebhookService(this.client)
    }

    setApiKey(_apiKey: string) {
        this.apiKey = _apiKey
        this.init()
        return this
    }
}
