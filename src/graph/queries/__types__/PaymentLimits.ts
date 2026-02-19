/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PaymentLimitsInput } from './../../../types/globalTypes'

// ====================================================
// GraphQL query operation: PaymentLimits
// ====================================================

export interface PaymentLimits_paymentLimits {
    __typename: 'PaymentLimits'
    perTransaction: number
    dailyRemainingVolume: number
}

export interface PaymentLimits {
    paymentLimits: PaymentLimits_paymentLimits
}

export interface PaymentLimitsVariables {
    paymentLimitsInput: PaymentLimitsInput
}
