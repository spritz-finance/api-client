/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {
    PayableAccountType,
    BankAccountType,
    BankAccountSubType,
} from './../../../types/globalTypes'

// ====================================================
// GraphQL query operation: UserBankAccounts
// ====================================================

export interface UserBankAccounts_bankAccounts_bankAccountDetails_CanadianBankAccountDetails {
    __typename: 'CanadianBankAccountDetails'
}

export interface UserBankAccounts_bankAccounts_bankAccountDetails_USBankAccountDetails {
    __typename: 'USBankAccountDetails'
    routingNumber: string
}

export type UserBankAccounts_bankAccounts_bankAccountDetails =
    | UserBankAccounts_bankAccounts_bankAccountDetails_CanadianBankAccountDetails
    | UserBankAccounts_bankAccounts_bankAccountDetails_USBankAccountDetails

export interface UserBankAccounts_bankAccounts_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
    country: string
    currency: string
}

export interface UserBankAccounts_bankAccounts {
    __typename: 'BankAccount'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    createdAt: any
    type: PayableAccountType
    accountNumber: string
    bankAccountType: BankAccountType
    bankAccountSubType: BankAccountSubType
    holder: string
    email: string
    ownedByUser: boolean
    bankAccountDetails: UserBankAccounts_bankAccounts_bankAccountDetails
    institution: UserBankAccounts_bankAccounts_institution | null
}

export interface UserBankAccounts {
    bankAccounts: UserBankAccounts_bankAccounts[]
}
