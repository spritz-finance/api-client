/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {
    PayableAccountType,
    BankAccountType,
    BankAccountSubType,
    PaymentDeliveryMethod,
} from './../../../types/globalTypes'

// ====================================================
// GraphQL fragment: BankAccountFragment
// ====================================================

export interface BankAccountFragment_bankAccountDetails_CanadianBankAccountDetails {
    __typename: 'CanadianBankAccountDetails' | 'UKBankAccountDetails' | 'IBANBankAccountDetails'
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
    logo: string | null
    country: string
    currency: string
}

export interface BankAccountFragment_paymentAddresses {
    __typename: 'PaymentAddress'
    network: string
    address: string
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
    email: string | null
    ownedByUser: boolean
    bankAccountDetails: BankAccountFragment_bankAccountDetails | null
    deliveryMethods: PaymentDeliveryMethod[]
    institution: BankAccountFragment_institution | null
    paymentAddresses: BankAccountFragment_paymentAddresses[]
}
