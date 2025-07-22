/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { DebitCardInput, PayableAccountType, DebitCardNetwork } from './../../../types/globalTypes'

// ====================================================
// GraphQL mutation operation: CreateDebitCard
// ====================================================

export interface CreateDebitCard_createDebitCard {
    __typename: 'DebitCard'
    id: string
    type: PayableAccountType
    name: string | null
    userId: string
    country: string
    currency: string
    payable: boolean
    debitCardNetwork: DebitCardNetwork
    expirationDate: string
    cardNumber: string
    mask: string | null
    createdAt: any
    paymentCount: number
    externalId: string | null
}

export interface CreateDebitCard {
    createDebitCard: CreateDebitCard_createDebitCard
}

export interface CreateDebitCardVariables {
    createDebitCardInput: DebitCardInput
}
