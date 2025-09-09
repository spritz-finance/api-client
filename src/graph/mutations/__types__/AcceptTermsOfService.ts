/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: AcceptTermsOfService
// ====================================================

export interface AcceptTermsOfService_setBridgeUserAgreementId {
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

export interface AcceptTermsOfService {
    setBridgeUserAgreementId: AcceptTermsOfService_setBridgeUserAgreementId
}

export interface AcceptTermsOfServiceVariables {
    agreementId: string
}
