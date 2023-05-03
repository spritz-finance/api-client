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
// GraphQL mutation operation: DeletePayableAccount
// ====================================================

export interface DeletePayableAccount_deletePayableAccount_Bill_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string
    country: string
    currency: string
}

export interface DeletePayableAccount_deletePayableAccount_Bill {
    __typename: 'Bill'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    createdAt: any
    type: PayableAccountType
    institution: DeletePayableAccount_deletePayableAccount_Bill_institution | null
}

export interface DeletePayableAccount_deletePayableAccount_BankAccount_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string
    country: string
    currency: string
}

export interface DeletePayableAccount_deletePayableAccount_BankAccount_bankAccountDetails_CanadianBankAccountDetails {
    __typename: 'CanadianBankAccountDetails'
}

export interface DeletePayableAccount_deletePayableAccount_BankAccount_bankAccountDetails_USBankAccountDetails {
    __typename: 'USBankAccountDetails'
    routingNumber: string
}

export type DeletePayableAccount_deletePayableAccount_BankAccount_bankAccountDetails =
    | DeletePayableAccount_deletePayableAccount_BankAccount_bankAccountDetails_CanadianBankAccountDetails
    | DeletePayableAccount_deletePayableAccount_BankAccount_bankAccountDetails_USBankAccountDetails

export interface DeletePayableAccount_deletePayableAccount_BankAccount {
    __typename: 'BankAccount'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    createdAt: any
    type: PayableAccountType
    institution: DeletePayableAccount_deletePayableAccount_BankAccount_institution | null
    accountNumber: string
    bankAccountType: BankAccountType
    bankAccountSubType: BankAccountSubType
    holder: string
    email: string
    ownedByUser: boolean
    bankAccountDetails: DeletePayableAccount_deletePayableAccount_BankAccount_bankAccountDetails
}

export type DeletePayableAccount_deletePayableAccount =
    | DeletePayableAccount_deletePayableAccount_Bill
    | DeletePayableAccount_deletePayableAccount_BankAccount

export interface DeletePayableAccount {
    deletePayableAccount: DeletePayableAccount_deletePayableAccount
}

export interface DeletePayableAccountVariables {
    accountId: string
}
