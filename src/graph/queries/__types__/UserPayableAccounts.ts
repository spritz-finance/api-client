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
// GraphQL query operation: UserPayableAccounts
// ====================================================

export interface UserPayableAccounts_payableAccounts_Bill_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string
    country: string
    currency: string
}

export interface UserPayableAccounts_payableAccounts_Bill {
    __typename: 'Bill'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    createdAt: any
    type: PayableAccountType
    institution: UserPayableAccounts_payableAccounts_Bill_institution | null
}

export interface UserPayableAccounts_payableAccounts_BankAccount_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string
    country: string
    currency: string
}

export interface UserPayableAccounts_payableAccounts_BankAccount_bankAccountDetails_CanadianBankAccountDetails {
    __typename: 'CanadianBankAccountDetails'
}

export interface UserPayableAccounts_payableAccounts_BankAccount_bankAccountDetails_USBankAccountDetails {
    __typename: 'USBankAccountDetails'
    routingNumber: string
}

export type UserPayableAccounts_payableAccounts_BankAccount_bankAccountDetails =
    | UserPayableAccounts_payableAccounts_BankAccount_bankAccountDetails_CanadianBankAccountDetails
    | UserPayableAccounts_payableAccounts_BankAccount_bankAccountDetails_USBankAccountDetails

export interface UserPayableAccounts_payableAccounts_BankAccount {
    __typename: 'BankAccount'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    createdAt: any
    type: PayableAccountType
    institution: UserPayableAccounts_payableAccounts_BankAccount_institution | null
    accountNumber: string
    bankAccountType: BankAccountType
    bankAccountSubType: BankAccountSubType
    holder: string
    email: string
    ownedByUser: boolean
    bankAccountDetails: UserPayableAccounts_payableAccounts_BankAccount_bankAccountDetails
}

export type UserPayableAccounts_payableAccounts =
    | UserPayableAccounts_payableAccounts_Bill
    | UserPayableAccounts_payableAccounts_BankAccount

export interface UserPayableAccounts {
    payableAccounts: UserPayableAccounts_payableAccounts[]
}
