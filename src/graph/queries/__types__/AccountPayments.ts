/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PaymentStatus, PaymentDeliveryMethod } from './../../../types/globalTypes'

// ====================================================
// GraphQL query operation: AccountPayments
// ====================================================

export interface AccountPayments_paymentsForAccount {
    __typename: 'Payment'
    id: string
    userId: any
    status: PaymentStatus
    accountId: any
    amount: number | null
    feeAmount: number | null
    createdAt: any
    deliveryMethod: PaymentDeliveryMethod | null
    paymentRequestId: string | null
    targetCurrency: string | null
    targetCurrencyAmount: number
    targetCurrencyRate: number | null
}

export interface AccountPayments {
    paymentsForAccount: AccountPayments_paymentsForAccount[]
}

export interface AccountPaymentsVariables {
    accountId: string
}
