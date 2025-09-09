/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: VirtualAccountFragment
// ====================================================

export interface VirtualAccountFragment_depositInstructions {
    __typename: 'VirtualAccountDepositInstructions'
    bankAccountNumber: string
    bankAddress: string
    bankName: string
    bankRoutingNumber: string
    currency: string
    paymentMethod: string
}

export interface VirtualAccountFragment {
    __typename: 'BridgeVirtualAccount'
    id: string
    network: string
    address: string
    currency: string
    token: string
    deposited: boolean
    microdeposits: number[] | null
    depositInstructions: VirtualAccountFragment_depositInstructions | null
}
