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

export interface UserBankAccounts_userBankAccounts_bankAccountDetails_CanadianBankAccountDetails {
    __typename: 'CanadianBankAccountDetails'
}

export interface UserBankAccounts_userBankAccounts_bankAccountDetails_USBankAccountDetails {
    __typename: 'USBankAccountDetails'
    routingNumber: string
}

export type UserBankAccounts_userBankAccounts_bankAccountDetails =
    | UserBankAccounts_userBankAccounts_bankAccountDetails_CanadianBankAccountDetails
    | UserBankAccounts_userBankAccounts_bankAccountDetails_USBankAccountDetails

export interface UserBankAccounts_userBankAccounts_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string
    country: string
    currency: string
}

export interface UserBankAccounts_userBankAccounts {
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
    bankAccountDetails: UserBankAccounts_userBankAccounts_bankAccountDetails
    institution: UserBankAccounts_userBankAccounts_institution | null
}

export interface UserBankAccounts {
    userBankAccounts: UserBankAccounts_userBankAccounts[]
}
