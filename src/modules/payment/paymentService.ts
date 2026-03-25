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
import type { PathResponse } from '../../rest/types'

type PaymentLimitsRaw = PathResponse<'/v1/bank-accounts/{accountId}/payment-limits', 'get'>

export interface PaymentLimitsResponse {
    perTransaction: number
    dailyLimit: number
    dailyRemainingVolume: number
}

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

    public async getPaymentLimits(accountId: string): Promise<PaymentLimitsResponse | null> {
        try {
            const raw = await this.client.restApi<PaymentLimitsRaw>({
                method: 'get',
                path: `/v1/bank-accounts/${encodeURIComponent(accountId)}/payment-limits`,
            })

            return {
                perTransaction: Number(raw.transactionLimit),
                dailyLimit: Number(raw.dailyLimit),
                dailyRemainingVolume: Number(raw.dailyRemaining),
            }
        } catch {
            return null
        }
    }
}
