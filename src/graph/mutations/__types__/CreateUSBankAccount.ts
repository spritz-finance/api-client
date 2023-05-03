/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {
    USBankAccountInput,
    PayableAccountType,
    BankAccountType,
    BankAccountSubType,
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

export interface CreateUSBankAccount_createUSBankAccount_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string
    country: string
    currency: string
}

export interface CreateUSBankAccount_createUSBankAccount {
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
    bankAccountDetails: CreateUSBankAccount_createUSBankAccount_bankAccountDetails
    institution: CreateUSBankAccount_createUSBankAccount_institution | null
}

export interface CreateUSBankAccount {
    createUSBankAccount: CreateUSBankAccount_createUSBankAccount
}

export interface CreateUSBankAccountVariables {
    createUSAccountInput: USBankAccountInput
}
