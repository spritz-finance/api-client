import { CurrentUser, CurrentUser_me } from '../../graph/queries/__types__/CurrentUser'
import { ModuleStatus } from '../../types/globalTypes'

type User = CurrentUser_me & {
    verificationStatus: VerificationStatus
    verificationUrl: string | null
    verifiedCountry: string | null
    canRetryVerification: boolean
}

export enum VerificationStatus {
    NotStarted = 'NotStarted',
    Verified = 'Verified',
    Failed = 'Failed',
    Disabled = 'Disabled',
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

    return {
        ...user,
        verificationStatus: transformModuleStatus(verification?.identity?.status),
        verificationUrl: verification?.identity?.verificationUrl ?? null,
        verifiedCountry: verification?.identity?.country ?? null,
        canRetryVerification: verification?.identity?.canRetry ?? false,
    }
}
