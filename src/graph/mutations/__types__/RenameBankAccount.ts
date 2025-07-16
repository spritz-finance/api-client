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
// GraphQL mutation operation: RenameBankAccount
// ====================================================

export interface RenameBankAccount_renamePayableAccount_Bill {
    __typename: 'Bill' | 'DebitCard' | 'DigitalAccount' | 'VirtualCard'
}

export interface RenameBankAccount_renamePayableAccount_BankAccount_bankAccountDetails_CanadianBankAccountDetails {
    __typename: 'CanadianBankAccountDetails' | 'UKBankAccountDetails' | 'IBANBankAccountDetails'
}

export interface RenameBankAccount_renamePayableAccount_BankAccount_bankAccountDetails_USBankAccountDetails {
    __typename: 'USBankAccountDetails'
    routingNumber: string
}

export type RenameBankAccount_renamePayableAccount_BankAccount_bankAccountDetails =
    | RenameBankAccount_renamePayableAccount_BankAccount_bankAccountDetails_CanadianBankAccountDetails
    | RenameBankAccount_renamePayableAccount_BankAccount_bankAccountDetails_USBankAccountDetails

export interface RenameBankAccount_renamePayableAccount_BankAccount_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
    country: string
    currency: string
}

export interface RenameBankAccount_renamePayableAccount_BankAccount_paymentAddresses {
    __typename: 'PaymentAddress'
    network: string
    address: string
}

export interface RenameBankAccount_renamePayableAccount_BankAccount {
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
    bankAccountDetails: RenameBankAccount_renamePayableAccount_BankAccount_bankAccountDetails | null
    deliveryMethods: PaymentDeliveryMethod[]
    institution: RenameBankAccount_renamePayableAccount_BankAccount_institution | null
    paymentAddresses: RenameBankAccount_renamePayableAccount_BankAccount_paymentAddresses[]
}

export type RenameBankAccount_renamePayableAccount =
    | RenameBankAccount_renamePayableAccount_Bill
    | RenameBankAccount_renamePayableAccount_BankAccount

export interface RenameBankAccount {
    renamePayableAccount: RenameBankAccount_renamePayableAccount
}

export interface RenameBankAccountVariables {
    accountId: string
    name: string
}
