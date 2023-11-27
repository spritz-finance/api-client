/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: TokenBalanceFragment
// ====================================================

export interface TokenBalanceFragment {
  __typename: "TokenBalance";
  /**
   * Token contract address
   */
  address: string;
  /**
   * Controlling wallet address
   */
  walletAddress: string;
  symbol: string;
  network: string;
  /**
   * ERC20 decimals
   */
  decimals: number;
  balance: number;
  balanceRaw: string;
  balanceUSD: number;
  price: number;
  tokenImageUrl: string;
}
