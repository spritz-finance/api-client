/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {
    PayableAccountType,
    BankAccountType,
    BankAccountSubType,
    VirtualCardType,
} from './../../../types/globalTypes'

// ====================================================
// GraphQL mutation operation: RenamePayableAccount
// ====================================================

export interface RenamePayableAccount_renamePayableAccount_Bill_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
    country: string
    currency: string
}

export interface RenamePayableAccount_renamePayableAccount_Bill {
    __typename: 'Bill'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    createdAt: any
    type: PayableAccountType
    institution: RenamePayableAccount_renamePayableAccount_Bill_institution | null
}

export interface RenamePayableAccount_renamePayableAccount_BankAccount_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
    country: string
    currency: string
}

export interface RenamePayableAccount_renamePayableAccount_BankAccount_bankAccountDetails_CanadianBankAccountDetails {
    __typename: 'CanadianBankAccountDetails'
}

export interface RenamePayableAccount_renamePayableAccount_BankAccount_bankAccountDetails_USBankAccountDetails {
    __typename: 'USBankAccountDetails'
    routingNumber: string
}

export type RenamePayableAccount_renamePayableAccount_BankAccount_bankAccountDetails =
    | RenamePayableAccount_renamePayableAccount_BankAccount_bankAccountDetails_CanadianBankAccountDetails
    | RenamePayableAccount_renamePayableAccount_BankAccount_bankAccountDetails_USBankAccountDetails

export interface RenamePayableAccount_renamePayableAccount_BankAccount {
    __typename: 'BankAccount'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    createdAt: any
    type: PayableAccountType
    institution: RenamePayableAccount_renamePayableAccount_BankAccount_institution | null
    accountNumber: string
    bankAccountType: BankAccountType
    bankAccountSubType: BankAccountSubType
    holder: string
    email: string
    ownedByUser: boolean
    bankAccountDetails: RenamePayableAccount_renamePayableAccount_BankAccount_bankAccountDetails
}

export interface RenamePayableAccount_renamePayableAccount_VirtualCard_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
    country: string
    currency: string
}

export interface RenamePayableAccount_renamePayableAccount_VirtualCard_billingInfo_address {
    __typename: 'CardHolderAddress'
    street: string | null
    street2: string | null
    city: string | null
    subdivision: string | null
    postalCode: string | null
    countryCode: string | null
}

export interface RenamePayableAccount_renamePayableAccount_VirtualCard_billingInfo {
    __typename: 'BillingInfo'
    holder: string
    phone: string
    email: string
    address: RenamePayableAccount_renamePayableAccount_VirtualCard_billingInfo_address | null
}

export interface RenamePayableAccount_renamePayableAccount_VirtualCard {
    __typename: 'VirtualCard'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    createdAt: any
    type: PayableAccountType
    institution: RenamePayableAccount_renamePayableAccount_VirtualCard_institution | null
    mask: string | null
    balance: number
    renderSecret: string | null
    virtualCardType: VirtualCardType
    billingInfo: RenamePayableAccount_renamePayableAccount_VirtualCard_billingInfo | null
}

export type RenamePayableAccount_renamePayableAccount =
    | RenamePayableAccount_renamePayableAccount_Bill
    | RenamePayableAccount_renamePayableAccount_BankAccount
    | RenamePayableAccount_renamePayableAccount_VirtualCard

export interface RenamePayableAccount {
    renamePayableAccount: RenamePayableAccount_renamePayableAccount
}

export interface RenamePayableAccountVariables {
    accountId: string
    name: string
}
