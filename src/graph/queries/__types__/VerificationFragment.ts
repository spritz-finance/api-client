/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ModuleStatus, VerificationFailureReason } from './../../../types/globalTypes'

// ====================================================
// GraphQL fragment: VerificationFragment
// ====================================================

export interface VerificationFragment_identity_verificationMetadata_details {
    __typename: 'VerificationMetadataDetails'
    matchedEmail: string | null
}

export interface VerificationFragment_identity_verificationMetadata {
    __typename: 'VerificationMetadata'
    failureReason: VerificationFailureReason | null
    details: VerificationFragment_identity_verificationMetadata_details | null
}

export interface VerificationFragment_identity {
    __typename: 'IdentityModule'
    canRetry: boolean
    status: ModuleStatus
    country: string | null
    verificationUrl: string | null
    verificationMetadata: VerificationFragment_identity_verificationMetadata | null
}

export interface VerificationFragment {
    __typename: 'Verification'
    userId: any
    identity: VerificationFragment_identity
}
