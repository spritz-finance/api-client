/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {
    USBankAccountInput,
    PayableAccountOriginator,
    PayableAccountType,
    BankAccountType,
    BankAccountSubType,
    VirtualCardType,
    BillType,
    AccountSyncStatus,
} from './../../../types/globalTypes'

// ====================================================
// GraphQL mutation operation: CreateUSBankAccount
// ====================================================

export interface CreateUSBankAccount_createUSBankAccount_bankAccountDetails_CanadianBankAccountDetails {
    __typename: 'CanadianBankAccountDetails'
}

export interface CreateUSBankAccount_createUSBankAccount_bankAccountDetails_USBankAccountDetails {
    __typename: 'USBankAccountDetails'
    routingNumber: string
}

export type CreateUSBankAccount_createUSBankAccount_bankAccountDetails =
    | CreateUSBankAccount_createUSBankAccount_bankAccountDetails_CanadianBankAccountDetails
    | CreateUSBankAccount_createUSBankAccount_bankAccountDetails_USBankAccountDetails

export interface CreateUSBankAccount_createUSBankAccount_dataSync {
    __typename: 'AccountDataSync'
    lastSync: any | null
    syncStatus: AccountSyncStatus | null
}

export interface CreateUSBankAccount_createUSBankAccount_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
}

export interface CreateUSBankAccount_createUSBankAccount {
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
    email: string
    ownedByUser: boolean
    bankAccountDetails: CreateUSBankAccount_createUSBankAccount_bankAccountDetails
    dataSync: CreateUSBankAccount_createUSBankAccount_dataSync | null
    institution: CreateUSBankAccount_createUSBankAccount_institution | null
}

export interface CreateUSBankAccount {
    createUSBankAccount: CreateUSBankAccount_createUSBankAccount
}

export interface CreateUSBankAccountVariables {
    createUSAccountInput: USBankAccountInput
}
