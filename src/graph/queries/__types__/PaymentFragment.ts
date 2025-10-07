/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PaymentStatus, PaymentDeliveryMethod } from './../../../types/globalTypes'

// ====================================================
// GraphQL fragment: PaymentFragment
// ====================================================

export interface PaymentFragment_transaction {
    __typename: 'BlockchainTransaction'
    hash: string
    from: string | null
    asset: string | null
    value: number | null
    network: string
}

export interface PaymentFragment {
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
    failureReason: string | null
    transaction: PaymentFragment_transaction | null
}
