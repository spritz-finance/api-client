/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: VirtualAccounts
// ====================================================

export interface VirtualAccounts_virtualAccounts_depositInstructions {
    __typename: 'VirtualAccountDepositInstructions'
    bankAccountNumber: string
    bankAddress: string
    bankName: string
    bankRoutingNumber: string
    currency: string
    paymentMethod: string
}

export interface VirtualAccounts_virtualAccounts {
    __typename: 'BridgeVirtualAccount'
    id: string
    network: string
    address: string
    currency: string
    token: string
    deposited: boolean
    microdeposits: number[] | null
    depositInstructions: VirtualAccounts_virtualAccounts_depositInstructions | null
}

export interface VirtualAccounts {
    virtualAccounts: VirtualAccounts_virtualAccounts[]
}
