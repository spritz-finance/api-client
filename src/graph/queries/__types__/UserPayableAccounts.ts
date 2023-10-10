/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {
    PayableAccountOriginator,
    PayableAccountType,
    BankAccountType,
    BankAccountSubType,
    VirtualCardType,
    BillType,
    AccountSyncStatus,
} from './../../../types/globalTypes'

// ====================================================
// GraphQL query operation: UserPayableAccounts
// ====================================================

export interface UserPayableAccounts_payableAccounts_BankAccount_dataSync {
    __typename: 'AccountDataSync'
    lastSync: any | null
    syncStatus: AccountSyncStatus | null
}

export interface UserPayableAccounts_payableAccounts_BankAccount_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
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
    payable: boolean
    originator: PayableAccountOriginator
    type: PayableAccountType
    createdAt: any
    dataSync: UserPayableAccounts_payableAccounts_BankAccount_dataSync | null
    institution: UserPayableAccounts_payableAccounts_BankAccount_institution | null
    accountNumber: string
    bankAccountType: BankAccountType
    bankAccountSubType: BankAccountSubType
    holder: string
    email: string | null
    ownedByUser: boolean
    bankAccountDetails: UserPayableAccounts_payableAccounts_BankAccount_bankAccountDetails
}

export interface UserPayableAccounts_payableAccounts_VirtualCard_dataSync {
    __typename: 'AccountDataSync'
    lastSync: any | null
    syncStatus: AccountSyncStatus | null
}

export interface UserPayableAccounts_payableAccounts_VirtualCard_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
}

export interface UserPayableAccounts_payableAccounts_VirtualCard_billingInfo_address {
    __typename: 'CardHolderAddress'
    street: string | null
    street2: string | null
    city: string | null
    subdivision: string | null
    postalCode: string | null
    countryCode: string | null
}

export interface UserPayableAccounts_payableAccounts_VirtualCard_billingInfo {
    __typename: 'BillingInfo'
    holder: string
    phone: string
    email: string
    address: UserPayableAccounts_payableAccounts_VirtualCard_billingInfo_address | null
}

export interface UserPayableAccounts_payableAccounts_VirtualCard {
    __typename: 'VirtualCard'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    payable: boolean
    originator: PayableAccountOriginator
    type: PayableAccountType
    createdAt: any
    dataSync: UserPayableAccounts_payableAccounts_VirtualCard_dataSync | null
    institution: UserPayableAccounts_payableAccounts_VirtualCard_institution | null
    mask: string | null
    balance: number
    renderSecret: string | null
    virtualCardType: VirtualCardType
    billingInfo: UserPayableAccounts_payableAccounts_VirtualCard_billingInfo | null
}

export interface UserPayableAccounts_payableAccounts_Bill_dataSync {
    __typename: 'AccountDataSync'
    lastSync: any | null
    syncStatus: AccountSyncStatus | null
}

export interface UserPayableAccounts_payableAccounts_Bill_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
}

export interface UserPayableAccounts_payableAccounts_Bill_billAccountDetails {
    __typename: 'BillAccountDetails'
    balance: number | null
    amountDue: number | null
    openedAt: any | null
    lastPaymentAmount: number | null
    lastPaymentDate: any | null
    nextPaymentDueDate: any | null
    nextPaymentMinimumAmount: number | null
    lastStatementBalance: number | null
    remainingStatementBalance: number | null
}

export interface UserPayableAccounts_payableAccounts_Bill {
    __typename: 'Bill'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    payable: boolean
    originator: PayableAccountOriginator
    type: PayableAccountType
    createdAt: any
    dataSync: UserPayableAccounts_payableAccounts_Bill_dataSync | null
    institution: UserPayableAccounts_payableAccounts_Bill_institution | null
    billType: BillType
    verifying: boolean
    billAccountDetails: UserPayableAccounts_payableAccounts_Bill_billAccountDetails | null
}

export type UserPayableAccounts_payableAccounts =
    | UserPayableAccounts_payableAccounts_BankAccount
    | UserPayableAccounts_payableAccounts_VirtualCard
    | UserPayableAccounts_payableAccounts_Bill

export interface UserPayableAccounts {
    payableAccounts: UserPayableAccounts_payableAccounts[]
}
