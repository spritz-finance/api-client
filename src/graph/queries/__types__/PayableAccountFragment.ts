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
// GraphQL fragment: PayableAccountFragment
// ====================================================

export interface PayableAccountFragment_Bill_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
    country: string
    currency: string
}

export interface PayableAccountFragment_Bill {
    __typename: 'Bill'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    createdAt: any
    type: PayableAccountType
    institution: PayableAccountFragment_Bill_institution | null
}

export interface PayableAccountFragment_BankAccount_bankAccountDetails_CanadianBankAccountDetails {
    __typename: 'CanadianBankAccountDetails'
}

export interface PayableAccountFragment_BankAccount_bankAccountDetails_USBankAccountDetails {
    __typename: 'USBankAccountDetails'
    routingNumber: string
}

export type PayableAccountFragment_BankAccount_bankAccountDetails =
    | PayableAccountFragment_BankAccount_bankAccountDetails_CanadianBankAccountDetails
    | PayableAccountFragment_BankAccount_bankAccountDetails_USBankAccountDetails

export interface PayableAccountFragment_BankAccount_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
    country: string
    currency: string
}

export interface PayableAccountFragment_BankAccount {
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
    bankAccountDetails: PayableAccountFragment_BankAccount_bankAccountDetails
    institution: PayableAccountFragment_BankAccount_institution | null
}

export interface PayableAccountFragment_VirtualCard_billingInfo_address {
    __typename: 'CardHolderAddress'
    street: string | null
    street2: string | null
    city: string | null
    subdivision: string | null
    postalCode: string | null
    countryCode: string | null
}

export interface PayableAccountFragment_VirtualCard_billingInfo {
    __typename: 'BillingInfo'
    holder: string
    phone: string
    email: string
    address: PayableAccountFragment_VirtualCard_billingInfo_address | null
}

export interface PayableAccountFragment_VirtualCard_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
    country: string
    currency: string
}

export interface PayableAccountFragment_VirtualCard {
    __typename: 'VirtualCard'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    createdAt: any
    type: PayableAccountType
    mask: string | null
    balance: number
    renderSecret: string | null
    virtualCardType: VirtualCardType
    billingInfo: PayableAccountFragment_VirtualCard_billingInfo | null
    institution: PayableAccountFragment_VirtualCard_institution | null
}

export type PayableAccountFragment =
    | PayableAccountFragment_Bill
    | PayableAccountFragment_BankAccount
    | PayableAccountFragment_VirtualCard
