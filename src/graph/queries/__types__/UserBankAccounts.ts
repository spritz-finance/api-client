/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { BankAccountType } from './../../../types/globalTypes'

// ====================================================
// GraphQL query operation: UserBankAccounts
// ====================================================

export interface UserBankAccounts_userBankAccounts_institution {
    __typename: 'BankAccountInstitution'
    id: string
    name: string
    logo: string | null
}

export interface UserBankAccounts_userBankAccounts {
    __typename: 'USLocalBankAccount'
    id: string
    accountNumber: string
    type: BankAccountType | null
    country: string
    currency: string
    routingNumber: string
    institution: UserBankAccounts_userBankAccounts_institution | null
}

export interface UserBankAccounts {
    userBankAccounts: UserBankAccounts_userBankAccounts[]
}
