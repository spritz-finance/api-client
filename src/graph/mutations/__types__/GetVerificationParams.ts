/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: GetVerificationParams
// ====================================================

export interface GetVerificationParams_getVerificationParams {
    __typename: 'VerificationParams'
    inquiryId: string
    verificationUrl: string | null
    sessionToken: string | null
    verificationUrlExpiresAt: any | null
}

export interface GetVerificationParams {
    getVerificationParams: GetVerificationParams_getVerificationParams
}
