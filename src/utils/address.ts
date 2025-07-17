import { isAddress } from 'viem'
import { PublicKey } from '@solana/web3.js'

/**
 * Validates if a string is a valid Ethereum address
 * Uses viem's built-in address validation with relaxed checksum validation
 * to match the existing behavior that accepts all-caps and lowercase addresses
 */
export function isValidEthereumAddress(tokenAddress: string): boolean {
    // First check basic format - handle both 0x and 0X prefixes
    if (!/^0[xX][0-9a-fA-F]{40}$/.test(tokenAddress)) {
        return false
    }

    // Normalize the address to have lowercase 0x prefix
    const normalizedAddress = '0x' + tokenAddress.slice(2)
    const addressPart = normalizedAddress.slice(2)

    // If it's all lowercase or all uppercase, it's valid (no checksum)
    if (addressPart === addressPart.toLowerCase() || addressPart === addressPart.toUpperCase()) {
        return true
    }

    // For mixed case, use viem's strict validation
    return isAddress(normalizedAddress)
}

/**
 * Validates if a string is a valid Solana address (public key)
 * Solana addresses are base58-encoded 32-byte public keys
 */
export function isValidSolanaAddress(address: string): boolean {
    try {
        new PublicKey(address)
        return true
    } catch {
        return false
    }
}
