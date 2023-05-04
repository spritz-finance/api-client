import sha from 'js-sha3'

export function isValidEthereumAddress(tokenAddress: string, strict = false): boolean {
    // Check if the tokenAddress is a valid Ethereum address by its length and format
    if (!/^0x[0-9a-fA-F]{40}$/.test(tokenAddress)) {
        return false
    }

    // If strict mode is enabled, perform EIP-55 checksum validation
    if (strict) {
        const address = tokenAddress.substring(2)
        const addressHash = sha.keccak256.hex(address.toLowerCase())

        for (let i = 0; i < 40; i++) {
            const currentChar = address.charAt(i)
            const hashChar = parseInt(addressHash.charAt(i), 16)
            if (
                (hashChar > 7 && currentChar.toUpperCase() !== currentChar) ||
                (hashChar <= 7 && currentChar.toLowerCase() !== currentChar)
            ) {
                return false
            }
        }
    }

    return true
}
