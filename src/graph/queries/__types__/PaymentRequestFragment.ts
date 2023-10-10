/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { DirectPaymentStatus } from './../../../types/globalTypes'

// ====================================================
// GraphQL fragment: PaymentRequestFragment
// ====================================================

export interface PaymentRequestFragment {
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
