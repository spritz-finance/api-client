/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { BillType } from "./../../../types/globalTypes";

// ====================================================
// GraphQL query operation: PopularBillInstitutions
// ====================================================

export interface PopularBillInstitutions_popularUSBillInstitutions {
  __typename: "BankAccountInstitution" | "BillInstitution";
  id: string;
  country: string;
  currency: string;
  name: string;
  logo: string | null;
}

export interface PopularBillInstitutions {
  popularUSBillInstitutions: PopularBillInstitutions_popularUSBillInstitutions[];
}

export interface PopularBillInstitutionsVariables {
  billType?: BillType | null;
}
