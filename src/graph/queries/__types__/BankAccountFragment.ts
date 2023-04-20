/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { BankAccountType } from './../../../types/globalTypes'

// ====================================================
// GraphQL fragment: BankAccountFragment
// ====================================================

export interface BankAccountFragment_institution {
    __typename: 'BankAccountInstitution'
    id: string
    name: string
    logo: string | null
}

export interface BankAccountFragment {
    __typename: 'USLocalBankAccount'
    id: string
    accountNumber: string
    type: BankAccountType | null
    country: string
    currency: string
    routingNumber: string
    institution: BankAccountFragment_institution | null
}
