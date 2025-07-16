import { isAddress } from 'viem'

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