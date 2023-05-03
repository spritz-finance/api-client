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
// GraphQL fragment: BankAccountFragment
// ====================================================

export interface BankAccountFragment_bankAccountDetails_CanadianBankAccountDetails {
    __typename: 'CanadianBankAccountDetails'
}

export interface BankAccountFragment_bankAccountDetails_USBankAccountDetails {
    __typename: 'USBankAccountDetails'
    routingNumber: string
}

export type BankAccountFragment_bankAccountDetails =
    | BankAccountFragment_bankAccountDetails_CanadianBankAccountDetails
    | BankAccountFragment_bankAccountDetails_USBankAccountDetails

export interface BankAccountFragment_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string
    country: string
    currency: string
}

export interface BankAccountFragment {
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
    bankAccountDetails: BankAccountFragment_bankAccountDetails
    institution: BankAccountFragment_institution | null
}
