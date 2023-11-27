/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CreateOnrampPaymentInput, OnrampPaymentStatus } from "./../../../types/globalTypes";

// ====================================================
// GraphQL mutation operation: CreateOnrampPayment
// ====================================================

export interface CreateOnrampPayment_createOnrampPayment_depositInstructions {
  __typename: "OnrampPaymentDepositInstructions";
  amount: number;
  currency: string;
  bankName: string;
  bankAddress: string;
  bankBeneficiaryName: string;
  bankRoutingNumber: string;
  bankAccountNumber: string;
  paymentMethod: string;
  depositMessage: string;
}

export interface CreateOnrampPayment_createOnrampPayment {
  __typename: "OnRampPayment";
  id: string;
  amount: number;
  feeAmount: number;
  depositInstructions: CreateOnrampPayment_createOnrampPayment_depositInstructions;
  network: string;
  token: string;
  address: string;
  status: OnrampPaymentStatus;
  createdAt: any;
}

export interface CreateOnrampPayment {
  createOnrampPayment: CreateOnrampPayment_createOnrampPayment;
}

export interface CreateOnrampPaymentVariables {
  createOnrampPaymentInput: CreateOnrampPaymentInput;
}
