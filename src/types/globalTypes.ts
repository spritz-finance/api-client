/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export enum BankAccountSubType {
  Business = "Business",
  Checking = "Checking",
  Savings = "Savings",
}

export enum BankAccountType {
  USBankAccount = "USBankAccount",
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
