import { CurrentUser, CurrentUser_me } from '../../graph/queries/__types__/CurrentUser'
import { ModuleStatus } from '../../types/globalTypes'

export enum VerificationFailureReason {
    VerifySms = 'verify_sms',
    DocumentVerification = 'documentary_verification',
    RiskCheck = 'risk_check',
    KycCheck = 'kyc_check',
    WatchlistScreening = 'watchlist_screening',
    SelfieCheck = 'selfie_check',
    AddressInvalid = 'address_invalid',
    DuplicateIdentity = 'duplicate_identity',
}

type User = CurrentUser_me & {
    verificationStatus: VerificationStatus
    verificationUrl: string | null
    verifiedCountry: string | null
    canRetryVerification: boolean
    verificationMetadata: {
        failureReason: VerificationFailureReason
        details: {
            matchedEmail: string | null
        }
    } | null
}

export enum VerificationStatus {
    NotStarted = 'not_started',
    Verified = 'verified',
    Failed = 'failed',
    Disabled = 'disabled',
}

function transformModuleStatus(moduleStatus = ModuleStatus.INITIALIZED) {
    switch (moduleStatus) {
        case ModuleStatus.FAILED:
            return VerificationStatus.Failed
        case ModuleStatus.ACTIVE:
            return VerificationStatus.Verified
        case ModuleStatus.DISABLED:
            return VerificationStatus.Disabled
        case ModuleStatus.RETRY:
            return VerificationStatus.Failed
        default:
            return VerificationStatus.NotStarted
    }
}

export function transformUserResponse(response: CurrentUser): User | null {
    const user = response?.me ?? null
    if (!user) return null
    const verification = response?.verification ?? null

    const verificationMetadataResponse = verification?.identity?.verificationMetadata ?? null
    const matchedEmail = verificationMetadataResponse?.details?.matchedEmail ?? null

    const verificationMetadata = verificationMetadataResponse?.failureReason
        ? {
              failureReason:
                  verificationMetadataResponse.failureReason as unknown as VerificationFailureReason,
              details: {
                  matchedEmail,
              },
          }
        : null

    return {
        ...user,
        verificationStatus: transformModuleStatus(verification?.identity?.status),
        verificationUrl: verification?.identity?.verificationUrl ?? null,
        verifiedCountry: verification?.identity?.country ?? null,
        canRetryVerification: verification?.identity?.canRetry ?? false,
        verificationMetadata,
    }
}
