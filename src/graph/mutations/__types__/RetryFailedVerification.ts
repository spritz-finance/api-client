/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ModuleStatus, VerificationFailureReason } from './../../../types/globalTypes'

// ====================================================
// GraphQL mutation operation: RetryFailedVerification
// ====================================================

export interface RetryFailedVerification_retryFailedVerification_identity_verificationMetadata_details {
    __typename: 'VerificationMetadataDetails'
    matchedEmail: string | null
}

export interface RetryFailedVerification_retryFailedVerification_identity_verificationMetadata {
    __typename: 'VerificationMetadata'
    failureReason: VerificationFailureReason | null
    details: RetryFailedVerification_retryFailedVerification_identity_verificationMetadata_details | null
}

export interface RetryFailedVerification_retryFailedVerification_identity {
    __typename: 'IdentityModule'
    canRetry: boolean
    status: ModuleStatus
    country: string | null
    verificationUrl: string | null
    verificationMetadata: RetryFailedVerification_retryFailedVerification_identity_verificationMetadata | null
}

export interface RetryFailedVerification_retryFailedVerification {
    __typename: 'Verification'
    userId: any
    identity: RetryFailedVerification_retryFailedVerification_identity
}

export interface RetryFailedVerification {
    retryFailedVerification: RetryFailedVerification_retryFailedVerification
}
