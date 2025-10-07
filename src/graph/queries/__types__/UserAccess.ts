/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ModuleStatus } from './../../../types/globalTypes'

// ====================================================
// GraphQL query operation: UserAccess
// ====================================================

export interface UserAccess_me {
    __typename: 'User'
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
    createdAt: any
    timezone: string | null
}

export interface UserAccess_verification_identity_verificationMetadata_details {
    __typename: 'VerificationMetadataDetails'
    matchedEmail: string | null
}

export interface UserAccess_verification_identity_verificationMetadata {
    __typename: 'VerificationMetadata'
    failureReason: string | null
    details: UserAccess_verification_identity_verificationMetadata_details | null
}

export interface UserAccess_verification_identity {
    __typename: 'IdentityModule'
    canRetry: boolean
    status: ModuleStatus
    country: string | null
    verificationUrl: string | null
    verificationMetadata: UserAccess_verification_identity_verificationMetadata | null
}

export interface UserAccess_verification {
    __typename: 'Verification'
    userId: any
    identity: UserAccess_verification_identity
}

export interface UserAccess_bridgeUser {
    __typename: 'BridgeUser'
    id: string
    kycStatus: string
    tosLink: string | null
    tosStatus: string
    status: string
    signedAgreementId: string | null
    error: string | null
    hasAcceptedTos: boolean
}

export interface UserAccess {
    me: UserAccess_me
    verification: UserAccess_verification | null
    bridgeUser: UserAccess_bridgeUser | null
}
