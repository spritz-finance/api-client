/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PaymentStatus } from './../../../types/globalTypes'

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
}

export interface AccountPayments {
    paymentsForAccount: AccountPayments_paymentsForAccount[]
}

export interface AccountPaymentsVariables {
    accountId: string
}
