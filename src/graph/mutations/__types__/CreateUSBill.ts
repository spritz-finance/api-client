/* tslint:disable */

// @generated
// This file was automatically generated and should not be edited.

import { BillType, PayableAccountOriginator, AccountSyncStatus } from './../../../types/globalTypes'

// ====================================================
// GraphQL mutation operation: CreateUSBill
// ====================================================

export interface CreateUSBill_addUSBill_billAccountDetails {
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

export interface CreateUSBill_addUSBill_dataSync {
    __typename: 'AccountDataSync'
    lastSync: any | null
    syncStatus: AccountSyncStatus | null
}

export interface CreateUSBill_addUSBill_institution {
    __typename: 'BankAccountInstitution' | 'BillInstitution'
    id: string
    name: string
    logo: string | null
}

export interface CreateUSBill_addUSBill_paymentAddresses {
    __typename: 'PaymentAddress'
    network: string
    address: string
}

export interface CreateUSBill_addUSBill {
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
    billAccountDetails: CreateUSBill_addUSBill_billAccountDetails | null
    dataSync: CreateUSBill_addUSBill_dataSync | null
    institution: CreateUSBill_addUSBill_institution | null
    paymentAddresses: CreateUSBill_addUSBill_paymentAddresses[]
}

export interface CreateUSBill {
    addUSBill: CreateUSBill_addUSBill
}

export interface CreateUSBillVariables {
    institutionId: string
    accountNumber: string
    type?: BillType | null
}
