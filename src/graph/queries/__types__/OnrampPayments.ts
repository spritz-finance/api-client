/* tslint:disable */

// @generated
// This file was automatically generated and should not be edited.

import { OnrampPaymentStatus } from './../../../types/globalTypes'

// ====================================================
// GraphQL query operation: OnrampPayments
// ====================================================

export interface OnrampPayments_onrampPayments_depositInstructions {
    __typename: 'OnrampPaymentDepositInstructions'
    amount: number
    currency: string
    bankName: string
    bankAddress: string
    bankBeneficiaryName: string
    bankRoutingNumber: string
    bankAccountNumber: string
    paymentMethod: string
    depositMessage: string
}

export interface OnrampPayments_onrampPayments {
    __typename: 'OnRampPayment'
    id: string
    amount: number
    feeAmount: number
    depositInstructions: OnrampPayments_onrampPayments_depositInstructions | null
    network: string
    token: string
    address: string
    status: OnrampPaymentStatus
    createdAt: any
}

export interface OnrampPayments {
    onrampPayments: OnrampPayments_onrampPayments[]
}
