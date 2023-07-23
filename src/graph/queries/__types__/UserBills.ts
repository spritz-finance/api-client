/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PayableAccountOriginator, BillType, AccountSyncStatus } from './../../../types/globalTypes'

// ====================================================
// GraphQL query operation: UserBills
// ====================================================

export interface UserBills_bills_billAccountDetails {
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

export interface UserBills_bills_dataSync {
    __typename: 'AccountDataSync'
    lastSync: any | null
    syncStatus: AccountSyncStatus | null
}

export interface UserBills_bills_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
}

export interface UserBills_bills {
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
    billAccountDetails: UserBills_bills_billAccountDetails | null
    dataSync: UserBills_bills_dataSync | null
    institution: UserBills_bills_institution | null
}

export interface UserBills {
    bills: UserBills_bills[]
}
