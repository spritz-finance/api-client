/* tslint:disable */

// @generated
// This file was automatically generated and should not be edited.

import { PayableAccountOriginator, BillType, AccountSyncStatus } from './../../../types/globalTypes'

// ====================================================
// GraphQL fragment: BillFragment
// ====================================================

export interface BillFragment_billAccountDetails {
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

export interface BillFragment_dataSync {
    __typename: 'AccountDataSync'
    lastSync: any | null
    syncStatus: AccountSyncStatus | null
}

export interface BillFragment_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
}

export interface BillFragment_paymentAddresses {
    __typename: 'PaymentAddress'
    network: string
    address: string
}

export interface BillFragment {
    __typename: 'Bill'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    originator: PayableAccountOriginator
    payable: boolean
    verifying: boolean
    billType: BillType
    createdAt: any
    billAccountDetails: BillFragment_billAccountDetails | null
    dataSync: BillFragment_dataSync | null
    institution: BillFragment_institution | null
    paymentAddresses: BillFragment_paymentAddresses[]
}
