import {
    AccountPayments,
    AccountPaymentsVariables,
    Payment,
    PaymentRequestPayment,
    PaymentRequestPaymentVariables,
    PaymentVariables,
} from '../../graph/queries/__types__'
import PaymentRequestPaymentQuery from '../../graph/queries/paymentForPaymentRequest.graphql'
import AccountPaymentsQuery from '../../graph/queries/paymentsForAccount.graphql'
import PaymentQuery from '../../graph/queries/payment.graphql'
import { SpritzClient } from '../../lib/client'

export class PaymentService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async listForAccount(accountId: string) {
        const response = await this.client.query<AccountPayments, AccountPaymentsVariables>({
            query: AccountPaymentsQuery,
            variables: {
                accountId,
            },
        })

        return response?.paymentsForAccount ?? []
    }

    public async fetchById(paymentId: string) {
        const response = await this.client.query<Payment, PaymentVariables>({
            query: PaymentQuery,
            variables: {
                paymentId,
            },
        })

        return response?.payment ?? null
    }

    public async getForPaymentRequest(paymentRequestId: string) {
        const response = await this.client.query<
            PaymentRequestPayment,
            PaymentRequestPaymentVariables
        >({
            query: PaymentRequestPaymentQuery,
            variables: {
                paymentRequestId,
            },
        })

        return response?.paymentForPaymentRequest ?? null
    }
}
