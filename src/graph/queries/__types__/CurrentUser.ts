/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ModuleStatus } from './../../../types/globalTypes'

// ====================================================
// GraphQL query operation: CurrentUser
// ====================================================

export interface CurrentUser_me {
    __typename: 'User'
    id: string
    email: string | null
    firstName: string | null
    lastName: string | null
    createdAt: any
    timezone: string | null
}

export interface CurrentUser_verification_identity {
    __typename: 'IdentityModule'
    canRetry: boolean
    status: ModuleStatus
    country: string | null
    verificationUrl: string | null
}

export interface CurrentUser_verification {
    __typename: 'Verification'
    userId: any
    identity: CurrentUser_verification_identity
}

export interface CurrentUser {
    me: CurrentUser_me
    verification: CurrentUser_verification | null
}
