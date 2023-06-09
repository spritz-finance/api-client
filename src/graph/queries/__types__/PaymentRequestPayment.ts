/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PaymentStatus } from './../../../types/globalTypes'

// ====================================================
// GraphQL query operation: PaymentRequestPayment
// ====================================================

export interface PaymentRequestPayment_paymentForPaymentRequest {
    __typename: 'Payment'
    id: string
    userId: any
    status: PaymentStatus
    accountId: any | null
    amount: number | null
    feeAmount: number | null
    createdAt: any
}

export interface PaymentRequestPayment {
    paymentForPaymentRequest: PaymentRequestPayment_paymentForPaymentRequest | null
}

export interface PaymentRequestPaymentVariables {
    paymentRequestId: string
}
