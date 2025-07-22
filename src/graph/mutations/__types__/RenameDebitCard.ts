/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PayableAccountType, DebitCardNetwork } from './../../../types/globalTypes'

// ====================================================
// GraphQL mutation operation: RenameDebitCard
// ====================================================

export interface RenameDebitCard_renamePayableAccount_BankAccount {
    __typename: 'BankAccount' | 'Bill' | 'DigitalAccount' | 'VirtualCard'
}

export interface RenameDebitCard_renamePayableAccount_DebitCard {
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

export type RenameDebitCard_renamePayableAccount =
    | RenameDebitCard_renamePayableAccount_BankAccount
    | RenameDebitCard_renamePayableAccount_DebitCard

export interface RenameDebitCard {
    renamePayableAccount: RenameDebitCard_renamePayableAccount
}

export interface RenameDebitCardVariables {
    accountId: string
    name: string
}
