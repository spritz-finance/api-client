/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PaymentStatus, PaymentDeliveryMethod } from './../../../types/globalTypes'

// ====================================================
// GraphQL query operation: Payment
// ====================================================

export interface Payment_payment {
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
}

export interface Payment {
    payment: Payment_payment | null
}

export interface PaymentVariables {
    paymentId: string
}
