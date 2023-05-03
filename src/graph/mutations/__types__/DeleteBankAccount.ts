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
// GraphQL mutation operation: DeleteBankAccount
// ====================================================

export interface DeleteBankAccount_deletePayableAccount_Bill {
    __typename: 'Bill'
}

export interface DeleteBankAccount_deletePayableAccount_BankAccount_bankAccountDetails_CanadianBankAccountDetails {
    __typename: 'CanadianBankAccountDetails'
}

export interface DeleteBankAccount_deletePayableAccount_BankAccount_bankAccountDetails_USBankAccountDetails {
    __typename: 'USBankAccountDetails'
    routingNumber: string
}

export type DeleteBankAccount_deletePayableAccount_BankAccount_bankAccountDetails =
    | DeleteBankAccount_deletePayableAccount_BankAccount_bankAccountDetails_CanadianBankAccountDetails
    | DeleteBankAccount_deletePayableAccount_BankAccount_bankAccountDetails_USBankAccountDetails

export interface DeleteBankAccount_deletePayableAccount_BankAccount_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string
    country: string
    currency: string
}

export interface DeleteBankAccount_deletePayableAccount_BankAccount {
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
    bankAccountDetails: DeleteBankAccount_deletePayableAccount_BankAccount_bankAccountDetails
    institution: DeleteBankAccount_deletePayableAccount_BankAccount_institution | null
}

export type DeleteBankAccount_deletePayableAccount =
    | DeleteBankAccount_deletePayableAccount_Bill
    | DeleteBankAccount_deletePayableAccount_BankAccount

export interface DeleteBankAccount {
    deletePayableAccount: DeleteBankAccount_deletePayableAccount
}

export interface DeleteBankAccountVariables {
    accountId: string
}
