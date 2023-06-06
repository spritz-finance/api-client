/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PayableAccountType, VirtualCardType } from './../../../types/globalTypes'

// ====================================================
// GraphQL query operation: UserVirtualDebitCard
// ====================================================

export interface UserVirtualDebitCard_virtualDebitCard_billingInfo_address {
    __typename: 'CardHolderAddress'
    street: string | null
    street2: string | null
    city: string | null
    subdivision: string | null
    postalCode: string | null
    countryCode: string | null
}

export interface UserVirtualDebitCard_virtualDebitCard_billingInfo {
    __typename: 'BillingInfo'
    holder: string
    phone: string
    email: string
    address: UserVirtualDebitCard_virtualDebitCard_billingInfo_address | null
}

export interface UserVirtualDebitCard_virtualDebitCard {
    __typename: 'VirtualCard'
    id: string
    name: string | null
    userId: string
    country: string
    currency: string
    createdAt: any
    type: PayableAccountType
    mask: string | null
    balance: number
    renderSecret: string | null
    virtualCardType: VirtualCardType
    billingInfo: UserVirtualDebitCard_virtualDebitCard_billingInfo | null
}

export interface UserVirtualDebitCard {
    virtualDebitCard: UserVirtualDebitCard_virtualDebitCard | null
}
