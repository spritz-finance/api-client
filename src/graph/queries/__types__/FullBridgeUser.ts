/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: FullBridgeUser
// ====================================================

export interface FullBridgeUser {
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
