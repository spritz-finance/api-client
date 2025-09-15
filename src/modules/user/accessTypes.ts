export interface UserAccessCapabilities {
    kycStatus: KycStatus
    kycRequirement?: Requirement
    capabilities: {
        onramp: CategoryAccess
        // offramp: CategoryAccess
        // card: CategoryAccess
    }
}

export interface KycStatus {
    verified: boolean
    country?: string | null
}

export interface CategoryAccess {
    active: boolean
    nextRequirement?: RequirementType
    features: string[]
    requirements: Requirement[]
}

export interface Requirement {
    type: RequirementType
    description?: string
    actionUrl?: string | null
    retryable?: boolean
    status: RequirementStatus
}

export enum RequirementStatus {
    NotStarted = 'not_started',
    Pending = 'pending',
    Completed = 'completed',
    Failed = 'failed',
}

export enum RequirementType {
    IdentityVerification = 'identity_verification',
    TermsAcceptance = 'terms_acceptance',
    AdditionalVerification = 'additional_verification',
    RegionalCompliance = 'regional_compliance',
    RiskEvaluation = 'risk_evaluation',
    DocumentSubmission = 'document_submission',
}

export enum OnrampFeatureType {
    AchPurchase = 'ach_purchase',
    WirePurchase = 'wire_purchase',
}

export enum OfframpFeatureType {
    UsBankAccount = 'us_bank_account',
    UsBills = 'us_bills',
    UsDebitCard = 'us_debit_card',
    IbanTransfer = 'iban_transfer',
    UkBankAccount = 'uk_bank_account',
    CaBankAccount = 'ca_bank_account',
}

export enum CardFeatureType {
    UsVirtualCard = 'us_virtual_card',
    UsPhysicalCard = 'us_physical_card',
}
