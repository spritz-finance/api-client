/* tslint:disable */

// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CurrentUser
// ====================================================

export interface CurrentUser_me {
    __typename: 'User'
    id: string
    sub: string | null
    email: string | null
    firstName: string | null
    lastName: string | null
    picture: string | null
    phone: string | null
    createdAt: any
    timezone: string | null
}

export interface CurrentUser {
    me: CurrentUser_me
}
