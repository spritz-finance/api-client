/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { PayableAccountOriginator, PayableAccountType, BankAccountType, BankAccountSubType, VirtualCardType, BillType, AccountSyncStatus } from "./../../../types/globalTypes";

// ====================================================
// GraphQL fragment: PayableAccountFragment
// ====================================================

export interface PayableAccountFragment_BankAccount_bankAccountDetails_CanadianBankAccountDetails {
  __typename: "CanadianBankAccountDetails" | "UKBankAccountDetails";
}

export interface PayableAccountFragment_BankAccount_bankAccountDetails_USBankAccountDetails {
  __typename: "USBankAccountDetails";
  routingNumber: string;
}

export type PayableAccountFragment_BankAccount_bankAccountDetails = PayableAccountFragment_BankAccount_bankAccountDetails_CanadianBankAccountDetails | PayableAccountFragment_BankAccount_bankAccountDetails_USBankAccountDetails;

export interface PayableAccountFragment_BankAccount_dataSync {
  __typename: "AccountDataSync";
  lastSync: any | null;
  syncStatus: AccountSyncStatus | null;
}

export interface PayableAccountFragment_BankAccount_institution {
  __typename: "BankAccountInstitution" | "BillInstitution";
  id: string;
  name: string;
  logo: string | null;
}

export interface PayableAccountFragment_BankAccount {
  __typename: "BankAccount";
  id: string;
  name: string | null;
  userId: string;
  country: string;
  currency: string;
  payable: boolean;
  originator: PayableAccountOriginator;
  type: PayableAccountType;
  createdAt: any;
  accountNumber: string;
  bankAccountType: BankAccountType;
  bankAccountSubType: BankAccountSubType;
  holder: string;
  email: string | null;
  ownedByUser: boolean;
  bankAccountDetails: PayableAccountFragment_BankAccount_bankAccountDetails;
  dataSync: PayableAccountFragment_BankAccount_dataSync | null;
  institution: PayableAccountFragment_BankAccount_institution | null;
}

export interface PayableAccountFragment_VirtualCard_billingInfo_address {
  __typename: "CardHolderAddress";
  street: string | null;
  street2: string | null;
  city: string | null;
  subdivision: string | null;
  postalCode: string | null;
  countryCode: string | null;
}

export interface PayableAccountFragment_VirtualCard_billingInfo {
  __typename: "BillingInfo";
  holder: string;
  phone: string;
  email: string;
  address: PayableAccountFragment_VirtualCard_billingInfo_address | null;
}

export interface PayableAccountFragment_VirtualCard_dataSync {
  __typename: "AccountDataSync";
  lastSync: any | null;
  syncStatus: AccountSyncStatus | null;
}

export interface PayableAccountFragment_VirtualCard_institution {
  __typename: "BankAccountInstitution" | "BillInstitution";
  id: string;
  name: string;
  logo: string | null;
}

export interface PayableAccountFragment_VirtualCard {
  __typename: "VirtualCard";
  id: string;
  name: string | null;
  userId: string;
  country: string;
  currency: string;
  payable: boolean;
  originator: PayableAccountOriginator;
  type: PayableAccountType;
  createdAt: any;
  mask: string | null;
  balance: number;
  renderSecret: string | null;
  virtualCardType: VirtualCardType;
  billingInfo: PayableAccountFragment_VirtualCard_billingInfo | null;
  dataSync: PayableAccountFragment_VirtualCard_dataSync | null;
  institution: PayableAccountFragment_VirtualCard_institution | null;
}

export interface PayableAccountFragment_Bill_billAccountDetails {
  __typename: "BillAccountDetails";
  balance: number | null;
  amountDue: number | null;
  openedAt: any | null;
  lastPaymentAmount: number | null;
  lastPaymentDate: any | null;
  nextPaymentDueDate: any | null;
  nextPaymentMinimumAmount: number | null;
  lastStatementBalance: number | null;
  remainingStatementBalance: number | null;
}

export interface PayableAccountFragment_Bill_dataSync {
  __typename: "AccountDataSync";
  lastSync: any | null;
  syncStatus: AccountSyncStatus | null;
}

export interface PayableAccountFragment_Bill_institution {
  __typename: "BankAccountInstitution" | "BillInstitution";
  id: string;
  name: string;
  logo: string | null;
}

export interface PayableAccountFragment_Bill {
  __typename: "Bill";
  id: string;
  name: string | null;
  userId: string;
  country: string;
  currency: string;
  payable: boolean;
  originator: PayableAccountOriginator;
  type: PayableAccountType;
  createdAt: any;
  billType: BillType;
  verifying: boolean;
  billAccountDetails: PayableAccountFragment_Bill_billAccountDetails | null;
  dataSync: PayableAccountFragment_Bill_dataSync | null;
  institution: PayableAccountFragment_Bill_institution | null;
}

export type PayableAccountFragment = PayableAccountFragment_BankAccount | PayableAccountFragment_VirtualCard | PayableAccountFragment_Bill;
