/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ModuleStatus } from './../../../types/globalTypes'

// ====================================================
// GraphQL fragment: VerificationFragment
// ====================================================

export interface VerificationFragment_identity {
    __typename: 'IdentityModule'
    canRetry: boolean
    status: ModuleStatus
    country: string | null
    verificationUrl: string | null
}

export interface VerificationFragment {
    __typename: 'Verification'
    userId: any
    identity: VerificationFragment_identity
}
