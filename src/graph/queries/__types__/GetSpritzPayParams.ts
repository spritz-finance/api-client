/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetSpritzPayParams
// ====================================================

export interface GetSpritzPayParams_spritzPayParams {
    __typename: 'PaymentParams'
    contractAddress: string
    method: string
    calldata: string
    value: string | null
    requiredTokenInput: string
    suggestedGasLimit: string | null
}

export interface GetSpritzPayParams {
    spritzPayParams: GetSpritzPayParams_spritzPayParams
}

export interface GetSpritzPayParamsVariables {
    tokenAddress: string
    amount: number
    reference: string
    network: string
}
