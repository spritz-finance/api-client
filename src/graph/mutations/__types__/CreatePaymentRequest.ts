/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CreateDirectPaymentInput, DirectPaymentStatus } from './../../../types/globalTypes'

// ====================================================
// GraphQL mutation operation: CreatePaymentRequest
// ====================================================

export interface CreatePaymentRequest_createDirectPayment {
    __typename: 'DirectPayment'
    id: string
    userId: any
    accountId: any
    status: DirectPaymentStatus
    amount: number
    feeAmount: number | null
    amountDue: number
    network: string
    createdAt: any
    deliveryMethod: string | null
}

export interface CreatePaymentRequest {
    createDirectPayment: CreatePaymentRequest_createDirectPayment
}

export interface CreatePaymentRequestVariables {
    createDirectPaymentInput: CreateDirectPaymentInput
}
