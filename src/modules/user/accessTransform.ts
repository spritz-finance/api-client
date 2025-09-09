import { UserAccess, UserAccess_bridgeUser } from '../../graph/queries/__types__'
import {
    CategoryAccess,
    KycStatus,
    OnrampFeatureType,
    Requirement,
    RequirementStatus,
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

function getKycRequirement({
    verificationUrl,
    verificationStatus,
    retryable,
}: {
    verificationUrl: string | null
    verificationStatus: VerificationStatus
    retryable: boolean
}): Requirement | undefined {
    if (verificationStatus === VerificationStatus.Verified) {
        return undefined
    }

    if (verificationStatus === VerificationStatus.Failed) {
        return {
            type: RequirementType.IdentityVerification,
            description: 'Identity verification failed. Please retry verification.',
            retryable,
            status: RequirementStatus.Failed,
        }
    }

    if (verificationStatus === VerificationStatus.NotStarted) {
        return {
            type: RequirementType.IdentityVerification,
            description: 'Verify your identity to unlock features',
            actionUrl: verificationUrl,
            status: RequirementStatus.NotStarted,
        }
    }

    return {
        type: RequirementType.IdentityVerification,
        description: 'Identity verification pending review',
        status: RequirementStatus.Pending,
    }
}

function transformTosLink(link: string) {
    try {
        // eslint-disable-next-line no-undef
        const url = new URL(link)
        url.searchParams.delete('redirect_uri')
        return url.toString()
    } catch {
        return link
    }
}

function getTosRequirement(
    hasAcceptedTos: boolean,
    tosLink?: string | null
): Requirement | undefined {
    if (hasAcceptedTos) {
        return undefined
    }

    if (tosLink) {
        return {
            type: RequirementType.TermsAcceptance,
            description: 'Please review and accept the terms of service',
            actionUrl: transformTosLink(tosLink),
            status: RequirementStatus.NotStarted,
        }
    }

    return undefined
}

function getBridgeKycRequirement(bridgeUser?: UserAccess_bridgeUser): Requirement | undefined {
    if (!bridgeUser) {
        return {
            type: RequirementType.IdentityVerification,
            status: RequirementStatus.NotStarted,
        }
    }

    if (bridgeUser.status === 'active' || bridgeUser.status === 'approved') {
        return undefined
    }

    if (bridgeUser.status === 'rejected' || bridgeUser.status === 'failed') {
        return {
            type: RequirementType.IdentityVerification,
            status: RequirementStatus.Failed,
        }
    }

    if (bridgeUser.status === 'pending' || bridgeUser.status === 'in_review') {
        return {
            type: RequirementType.IdentityVerification,
            status: RequirementStatus.Pending,
        }
    }

    // Default case for any other status
    return {
        type: RequirementType.IdentityVerification,
        status: RequirementStatus.NotStarted,
    }
}

function getOnrampFeatures(country: string | null): string[] {
    if (!country) {
        return []
    }

    const supportedCountries = ['US']
    const isSupported = supportedCountries.includes(country.toUpperCase())

    if (!isSupported) {
        return []
    }

    const features: string[] = []

    if (country.toUpperCase() === 'US') {
        features.push(OnrampFeatureType.AchPurchase, OnrampFeatureType.WirePurchase)
    }

    return features
}

function getOnrampAccess(kycStatus: KycStatus, bridgeUser?: UserAccess_bridgeUser): CategoryAccess {
    const availableFeatures = getOnrampFeatures(kycStatus.country ?? null)

    // Platform-level KYC blocks everything - this is a hard requirement
    if (!kycStatus.verified) {
        return {
            available: false,
            features: [], // No features until platform KYC is complete
            requirements: [], // Platform KYC is handled at the top level
        }
    }

    // Collect onramp-specific requirements
    const requirements: Requirement[] = []

    // Check bridge TOS requirement
    const tosRequirement = getTosRequirement(
        bridgeUser?.hasAcceptedTos ?? false,
        bridgeUser?.tosLink
    )
    if (tosRequirement) requirements.push(tosRequirement)

    const kycRequirement = getBridgeKycRequirement(bridgeUser)
    if (kycRequirement) requirements.push(kycRequirement)

    // If no features available in region
    if (availableFeatures.length === 0) {
        return {
            available: false,
            features: [],
            requirements,
        }
    }

    // Simple logic: if requirements are met, you get the features
    const result: CategoryAccess = {
        available: requirements.length === 0,
        features: requirements.length === 0 ? availableFeatures : [],
        requirements,
    }

    // Determine next requirement (TOS comes before Bridge KYC)
    if (tosRequirement) {
        result.nextRequirement = RequirementType.TermsAcceptance
    } else if (kycRequirement) {
        result.nextRequirement = RequirementType.IdentityVerification
    }

    return result
}

export function transformToUserAccess(
    response: UserAccess | null,
    verificationStatus: VerificationStatus,
    verifiedCountry: string | null
): UserAccessCapabilities {
    const bridgeUser = response?.bridgeUser

    const retryable = response?.verification?.identity?.canRetry ?? false
    const verificationUrl = response?.verification?.identity?.verificationUrl ?? null
    const kycStatus = getKycStatus(verificationStatus, verifiedCountry)
    const kycRequirement = getKycRequirement({ verificationStatus, retryable, verificationUrl })

    const capabilities = {
        onramp: getOnrampAccess(kycStatus, bridgeUser),
    }

    return {
        kycStatus,
        ...(kycRequirement && { kycRequirement }),
        capabilities,
    }
}
