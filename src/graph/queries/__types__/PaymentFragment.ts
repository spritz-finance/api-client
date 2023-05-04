/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PaymentStatus } from './../../../types/globalTypes'

// ====================================================
// GraphQL fragment: PaymentFragment
// ====================================================

export interface PaymentFragment {
    __typename: 'Payment'
    id: string
    userId: any
    status: PaymentStatus
    accountId: any | null
    deliveryDate: any | null
    amount: number | null
    feeAmount: number | null
    createdAt: any
}
