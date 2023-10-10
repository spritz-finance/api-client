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

export enum AccountSyncStatus {
  Active = "Active",
  Error = "Error",
  Syncing = "Syncing",
  Unavailable = "Unavailable",
}

export enum BankAccountSubType {
  Business = "Business",
  Checking = "Checking",
  Savings = "Savings",
}

export enum BankAccountType {
  CABankAccount = "CABankAccount",
  USBankAccount = "USBankAccount",
}

export enum BillType {
  AutoLoan = "AutoLoan",
  CreditCard = "CreditCard",
  Loan = "Loan",
  MobilePhone = "MobilePhone",
  Mortgage = "Mortgage",
  StudentLoan = "StudentLoan",
  Unknown = "Unknown",
  Utility = "Utility",
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
  DISABLED = "DISABLED",
  FAILED = "FAILED",
  INITIALIZED = "INITIALIZED",
  LOADING = "LOADING",
  RETRY = "RETRY",
  UNAVAILABLE = "UNAVAILABLE",
  UNINITIALIZED = "UNINITIALIZED",
}

export enum PayableAccountOriginator {
  Provider = "Provider",
  User = "User",
}

export enum PayableAccountType {
  BankAccount = "BankAccount",
  Bill = "Bill",
  VirtualCard = "VirtualCard",
}

export enum PaymentDeliveryMethod {
  INSTANT = "INSTANT",
  STANDARD = "STANDARD",
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

export enum VirtualCardType {
  USVirtualDebitCard = "USVirtualDebitCard",
}

export interface BankAccountInput {
  accountNumber: string;
  details?: any | null;
  email?: string | null;
  holder?: string | null;
  name: string;
  ownedByUser?: boolean | null;
  subType: BankAccountSubType;
  type: BankAccountType;
}

export interface CreateDirectPaymentInput {
  accountId: string;
  amount: number;
  deliveryMethod?: PaymentDeliveryMethod | null;
  network?: string | null;
  provider?: AccountProvider | null;
  rewardsAmount?: number | null;
  subscriptionId?: string | null;
  testPayment?: boolean | null;
  tokenAddress?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
