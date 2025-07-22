/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

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
  IbanAccount = "IbanAccount",
  UKBankAccount = "UKBankAccount",
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

export enum DebitCardNetwork {
  Mastercard = "Mastercard",
  Visa = "Visa",
}

export enum DirectPaymentStatus {
  COMPLETED = "COMPLETED",
  CONFIRMED = "CONFIRMED",
  CREATED = "CREATED",
  FAILED = "FAILED",
  FAILED_VALIDATION = "FAILED_VALIDATION",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
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

export enum OnrampPaymentStatus {
  AWAITING_FUNDS = "AWAITING_FUNDS",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  ON_HOLD = "ON_HOLD",
  PENDING = "PENDING",
  REFUNDED = "REFUNDED",
  REVERSED = "REVERSED",
}

export enum PayableAccountOriginator {
  Provider = "Provider",
  User = "User",
}

export enum PayableAccountType {
  BankAccount = "BankAccount",
  Bill = "Bill",
  DebitCard = "DebitCard",
  DigitalAccount = "DigitalAccount",
  VirtualCard = "VirtualCard",
}

export enum PaymentDeliveryMethod {
  INSTANT = "INSTANT",
  SAME_DAY = "SAME_DAY",
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

export interface BankAccountAddressInput {
  street: string;
  street2?: string | null;
  city: string;
  subdivision: string;
  postalCode: string;
  countryCode?: string | null;
}

export interface BankAccountInput {
  name: string;
  email?: string | null;
  accountNumber: string;
  type: BankAccountType;
  ownedByUser?: boolean | null;
  holder?: string | null;
  holderFirstName?: string | null;
  holderLastName?: string | null;
  address?: BankAccountAddressInput | null;
  subType: BankAccountSubType;
  details?: any | null;
}

export interface CreateDirectPaymentInput {
  accountId: string;
  amount: number;
  rewardsAmount?: number | null;
  tokenAddress?: string | null;
  network: string;
  pointsRedemptionId?: string | null;
  paymentNote?: string | null;
  paymentStrategy?: string | null;
  deliveryMethod?: PaymentDeliveryMethod | null;
}

export interface CreateOnrampPaymentInput {
  amount: number;
  address: string;
  network: string;
  token: string;
  paymentMethod: string;
}

export interface DebitCardInput {
  name?: string | null;
  cardNumber: string;
  expirationDate: string;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
