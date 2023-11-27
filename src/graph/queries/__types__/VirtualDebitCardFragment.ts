/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PayableAccountType, VirtualCardType } from "./../../../types/globalTypes";

// ====================================================
// GraphQL fragment: VirtualDebitCardFragment
// ====================================================

export interface VirtualDebitCardFragment_billingInfo_address {
  __typename: "CardHolderAddress";
  street: string | null;
  street2: string | null;
  city: string | null;
  subdivision: string | null;
  postalCode: string | null;
  countryCode: string | null;
}

export interface VirtualDebitCardFragment_billingInfo {
  __typename: "BillingInfo";
  holder: string;
  phone: string;
  email: string;
  address: VirtualDebitCardFragment_billingInfo_address | null;
}

export interface VirtualDebitCardFragment_paymentAddresses {
  __typename: "PaymentAddress";
  network: string;
  address: string;
}

export interface VirtualDebitCardFragment {
  __typename: "VirtualCard";
  id: string;
  name: string | null;
  userId: string;
  country: string;
  currency: string;
  createdAt: any;
  type: PayableAccountType;
  mask: string | null;
  balance: number;
  renderSecret: string | null;
  virtualCardType: VirtualCardType;
  billingInfo: VirtualDebitCardFragment_billingInfo | null;
  paymentAddresses: VirtualDebitCardFragment_paymentAddresses[];
}
