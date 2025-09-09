import { UserAccess } from '../../graph/queries/__types__'
import {
    CategoryAccess,
    FeatureAccess,
    FeatureStatus,
    KycStatus,
    OnrampFeatureType,
    Requirement,
    RequirementType,
    UserAccessCapabilities,
} from './accessTypes'
import { VerificationStatus } from './transform'

function getKycStatus(verificationStatus: VerificationStatus, country?: string | null): KycStatus {
    return {
        verified: verificationStatus === VerificationStatus.Verified,
        country: country ?? null,
    }
}

function getKycRequirement(verificationStatus: VerificationStatus): Requirement | undefined {
    if (verificationStatus === VerificationStatus.Verified) {
        return undefined
    }

    if (verificationStatus === VerificationStatus.Failed) {
        return {
            type: RequirementType.IdentityVerification,
            description: 'Identity verification failed. Please retry verification.',
            actionUrl: '/verify',
            userActionable: true,
        }
    }

    if (verificationStatus === VerificationStatus.NotStarted) {
        return {
            type: RequirementType.IdentityVerification,
            description: 'Verify your identity to unlock features',
            actionUrl: '/verify',
            userActionable: true,
        }
    }

    return {
        type: RequirementType.IdentityVerification,
        description: 'Identity verification pending review',
        userActionable: false,
    }
}

function getEmptyAccess(reason: string): CategoryAccess {
    return {
        available: false,
        reason,
        features: [],
    }
}

function getOnrampFeatures(country: string | null): FeatureAccess[] {
    if (!country) {
        return []
    }

    const supportedCountries = ['US', 'CA']
    const isSupported = supportedCountries.includes(country.toUpperCase())

    if (!isSupported) {
        return []
    }

    const features: FeatureAccess[] = []

    if (country.toUpperCase() === 'US') {
        features.push({
            type: OnrampFeatureType.AchPurchase,
            available: true,
            status: FeatureStatus.Active,
        })
    }

    if (country.toUpperCase() === 'CA') {
        // CA doesn't have ACH purchases
    }

    return features
}

function getOnrampAccess(kycStatus: KycStatus): CategoryAccess {
    if (!kycStatus.verified) {
        return getEmptyAccess('Identity verification required')
    }

    const features = getOnrampFeatures(kycStatus.country ?? null)

    if (features.length === 0) {
        return {
            available: false,
            reason: 'Not available in your region',
            features: [],
        }
    }

    return {
        available: true,
        features,
    }
}

export function transformToUserAccess(
    response: UserAccess | null,
    verificationStatus: VerificationStatus,
    verifiedCountry: string | null
): UserAccessCapabilities {
    const kycStatus = getKycStatus(verificationStatus, verifiedCountry)
    const kycRequirement = getKycRequirement(verificationStatus)

    const capabilities = {
        onramp: getOnrampAccess(kycStatus),
    }

    return {
        kycStatus,
        ...(kycRequirement && { kycRequirement }),
        capabilities,
    }
}
