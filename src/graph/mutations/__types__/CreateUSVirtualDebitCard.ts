/* tslint:disable */

// @generated
// This file was automatically generated and should not be edited.

import { PayableAccountType, VirtualCardType } from './../../../types/globalTypes'

// ====================================================
// GraphQL mutation operation: CreateUSVirtualDebitCard
// ====================================================

export interface CreateUSVirtualDebitCard_createUSVirtualDebitCard_billingInfo_address {
    __typename: 'CardHolderAddress'
    street: string | null
    street2: string | null
    city: string | null
    subdivision: string | null
    postalCode: string | null
    countryCode: string | null
}

export interface CreateUSVirtualDebitCard_createUSVirtualDebitCard_billingInfo {
    __typename: 'BillingInfo'
    holder: string
    phone: string
    email: string
    address: CreateUSVirtualDebitCard_createUSVirtualDebitCard_billingInfo_address | null
}

export interface CreateUSVirtualDebitCard_createUSVirtualDebitCard_paymentAddresses {
    __typename: 'PaymentAddress'
    network: string
    address: string
}

export interface CreateUSVirtualDebitCard_createUSVirtualDebitCard {
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
    billingInfo: CreateUSVirtualDebitCard_createUSVirtualDebitCard_billingInfo | null
    paymentAddresses: CreateUSVirtualDebitCard_createUSVirtualDebitCard_paymentAddresses[]
}

export interface CreateUSVirtualDebitCard {
    createUSVirtualDebitCard: CreateUSVirtualDebitCard_createUSVirtualDebitCard
}
