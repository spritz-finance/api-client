/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export enum AccountProvider {
  CHECKBOOK = "CHECKBOOK",
  METHOD_FI = "METHOD_FI",
}

export enum BankAccountSubType {
  Business = "Business",
  Checking = "Checking",
  Savings = "Savings",
}

export enum BankAccountType {
  USBankAccount = "USBankAccount",
}

export enum DirectPaymentStatus {
  COMPLETED = "COMPLETED",
  CONFIRMED = "CONFIRMED",
  CREATED = "CREATED",
  FAILED = "FAILED",
  PENDING = "PENDING",
  REFUNDED = "REFUNDED",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  TRANSACTION_PENDING = "TRANSACTION_PENDING",
}

export enum ModuleStatus {
  ACTIVE = "ACTIVE",
  FAILED = "FAILED",
  INITIALIZED = "INITIALIZED",
  LOADING = "LOADING",
  UNAVAILABLE = "UNAVAILABLE",
  UNINITIALIZED = "UNINITIALIZED",
}

export enum PayableAccountType {
  BankAccount = "BankAccount",
  Bill = "Bill",
  DebitCard = "DebitCard",
}

export enum PaymentStatus {
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  INITIALIZED = "INITIALIZED",
  PENDING = "PENDING",
  REFUNDED = "REFUNDED",
  REVERSAL_IN_PROGRESS = "REVERSAL_IN_PROGRESS",
  REVERSED = "REVERSED",
  SCHEDULED = "SCHEDULED",
  SENT = "SENT",
}

export interface CreateDirectPaymentInput {
  accountId: string;
  amount: number;
  network?: string | null;
  provider?: AccountProvider | null;
  rewardsAmount?: number | null;
  subscriptionId?: string | null;
  testPayment?: boolean | null;
  tokenAddress?: string | null;
}

export interface USBankAccountInput {
  accountNumber: string;
  email: string;
  holder: string;
  name: string;
  ownedByUser?: boolean | null;
  routingNumber: string;
  subType: BankAccountSubType;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
