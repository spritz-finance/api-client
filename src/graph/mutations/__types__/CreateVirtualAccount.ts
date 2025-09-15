/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateVirtualAccount
// ====================================================

export interface CreateVirtualAccount_createVirtualAccount_depositInstructions {
    __typename: 'VirtualAccountDepositInstructions'
    bankAccountNumber: string
    bankAddress: string
    bankName: string
    bankRoutingNumber: string
    currency: string
    paymentMethod: string
}

export interface CreateVirtualAccount_createVirtualAccount {
    __typename: 'BridgeVirtualAccount'
    id: string
    network: string
    address: string
    currency: string
    token: string
    deposited: boolean
    microdeposits: number[] | null
    depositInstructions: CreateVirtualAccount_createVirtualAccount_depositInstructions | null
}

export interface CreateVirtualAccount {
    createVirtualAccount: CreateVirtualAccount_createVirtualAccount
}

export interface CreateVirtualAccountVariables {
    network: string
    address: string
    token: string
}
