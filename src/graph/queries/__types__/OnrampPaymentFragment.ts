/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { OnrampPaymentStatus } from './../../../types/globalTypes'

// ====================================================
// GraphQL fragment: OnrampPaymentFragment
// ====================================================

export interface OnrampPaymentFragment_depositInstructions {
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

export interface OnrampPaymentFragment {
    __typename: 'OnRampPayment'
    id: string
    amount: number
    feeAmount: number
    depositInstructions: OnrampPaymentFragment_depositInstructions
    network: string
    token: string
    address: string
    status: OnrampPaymentStatus
    createdAt: any
}
