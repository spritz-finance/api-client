import {
    AccountPayments,
    AccountPaymentsVariables,
    PaymentRequestPayment,
    PaymentRequestPaymentVariables,
} from '../../graph/queries/__types__'
import PaymentRequestPaymentQuery from '../../graph/queries/paymentForPaymentRequest.graphql'
import AccountPaymentsQuery from '../../graph/queries/paymentsForAccount.graphql'
import { GraphClient } from '../../lib/client'

export class PaymentService {
    private client: GraphClient

    constructor(client: GraphClient) {
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
