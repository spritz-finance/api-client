/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {
    BankAccountInput,
    PayableAccountOriginator,
    PayableAccountType,
    BankAccountType,
    BankAccountSubType,
    VirtualCardType,
    BillType,
    AccountSyncStatus,
} from './../../../types/globalTypes'

// ====================================================
// GraphQL mutation operation: CreateBankAccount
// ====================================================

export interface CreateBankAccount_createBankAccount_bankAccountDetails_CanadianBankAccountDetails {
    __typename: 'CanadianBankAccountDetails' | 'UKBankAccountDetails' | 'IBANBankAccountDetails'
}

export interface CreateBankAccount_createBankAccount_bankAccountDetails_USBankAccountDetails {
    __typename: 'USBankAccountDetails'
    routingNumber: string
}

export type CreateBankAccount_createBankAccount_bankAccountDetails =
    | CreateBankAccount_createBankAccount_bankAccountDetails_CanadianBankAccountDetails
    | CreateBankAccount_createBankAccount_bankAccountDetails_USBankAccountDetails

export interface CreateBankAccount_createBankAccount_dataSync {
    __typename: 'AccountDataSync'
    lastSync: any | null
    syncStatus: AccountSyncStatus | null
}

export interface CreateBankAccount_createBankAccount_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
}

export interface CreateBankAccount_createBankAccount {
    __typename: 'BankAccount'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    payable: boolean
    originator: PayableAccountOriginator
    type: PayableAccountType
    createdAt: any
    accountNumber: string
    bankAccountType: BankAccountType
    bankAccountSubType: BankAccountSubType
    holder: string
    email: string | null
    ownedByUser: boolean
    bankAccountDetails: CreateBankAccount_createBankAccount_bankAccountDetails | null
    dataSync: CreateBankAccount_createBankAccount_dataSync | null
    institution: CreateBankAccount_createBankAccount_institution | null
}

export interface CreateBankAccount {
    createBankAccount: CreateBankAccount_createBankAccount
}

export interface CreateBankAccountVariables {
    createAccountInput: BankAccountInput
}
