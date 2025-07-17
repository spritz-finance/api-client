/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetSolanaPayParams
// ====================================================

export interface GetSolanaPayParams_solanaParams {
    __typename: 'SolanaParamsResponse'
    transactionSerialized: string
    transaction: any
}

export interface GetSolanaPayParams {
    solanaParams: GetSolanaPayParams_solanaParams
}

export interface GetSolanaPayParamsVariables {
    tokenAddress: string
    amount: number
    reference: string
    signer: string
}
