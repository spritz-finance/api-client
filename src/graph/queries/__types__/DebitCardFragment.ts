/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PayableAccountType, DebitCardNetwork } from './../../../types/globalTypes'

// ====================================================
// GraphQL fragment: DebitCardFragment
// ====================================================

export interface DebitCardFragment {
    __typename: 'DebitCard'
    id: string
    type: PayableAccountType
    name: string | null
    userId: string
    country: string
    currency: string
    payable: boolean
    debitCardNetwork: DebitCardNetwork
    expirationDate: string
    cardNumber: string
    mask: string | null
    createdAt: any
    paymentCount: number
    externalId: string | null
}
