/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { BillType } from "./../../../types/globalTypes";

// ====================================================
// GraphQL query operation: SearchUSBillInstitutions
// ====================================================

export interface SearchUSBillInstitutions_searchUSBillInstitutions {
  __typename: "BillInstitution";
  id: string;
  country: string;
  currency: string;
  name: string;
  logo: string | null;
}

export interface SearchUSBillInstitutions {
  searchUSBillInstitutions: SearchUSBillInstitutions_searchUSBillInstitutions[];
}

export interface SearchUSBillInstitutionsVariables {
  searchTerm: string;
  billType?: BillType | null;
}
