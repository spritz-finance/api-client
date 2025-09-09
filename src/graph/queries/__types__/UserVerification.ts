/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ModuleStatus } from './../../../types/globalTypes'

// ====================================================
// GraphQL query operation: UserVerification
// ====================================================

export interface UserVerification_verification_identity_user {
    __typename: 'UserIdentity'
    firstName: string | null
    lastName: string | null
    email: string | null
    completedAt: string | null
}

export interface UserVerification_verification_identity_verificationMetadata_details {
    __typename: 'VerificationMetadataDetails'
    matchedEmail: string | null
}

export interface UserVerification_verification_identity_verificationMetadata {
    __typename: 'VerificationMetadata'
    failureReason: string | null
    details: UserVerification_verification_identity_verificationMetadata_details | null
}

export interface UserVerification_verification_identity {
    __typename: 'IdentityModule'
    status: ModuleStatus
    country: string | null
    verificationUrl: string | null
    user: UserVerification_verification_identity_user | null
    verificationMetadata: UserVerification_verification_identity_verificationMetadata | null
}

export interface UserVerification_verification {
    __typename: 'Verification'
    userId: any
    identity: UserVerification_verification_identity
}

export interface UserVerification {
    verification: UserVerification_verification | null
}
