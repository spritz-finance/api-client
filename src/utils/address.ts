import hash from 'ethereum-cryptography/keccak'
import utils from 'ethereum-cryptography/utils'

export function uint8ArrayToHexString(uint8Array: Uint8Array): string {
    let hexString = '0x'
    for (const e of uint8Array) {
        const hex = e.toString(16)
        hexString += hex.length === 1 ? `0${hex}` : hex
    }
    return hexString
}

const checkAddressCheckSum = (data: string): boolean => {
    if (!/^(0x)?[0-9a-f]{40}$/i.test(data)) return false
    const address = data.slice(2)
    const updatedData = utils.utf8ToBytes(address.toLowerCase())
    const addressHash = uint8ArrayToHexString(hash.keccak256(updatedData)).slice(2)

    for (let i = 0; i < 40; i += 1) {
        // the nth letter should be uppercase if the nth digit of casemap is 1
        if (
            (parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) ||
            (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])
        ) {
            return false
        }
    }
    return true
}

export function isValidEthereumAddress(tokenAddress: string): boolean {
    // Check if the tokenAddress is a valid Ethereum address by its length and format

    if (!/^0x[0-9a-f]{40}$/i.test(tokenAddress)) {
        // Check if it has the basic requirements of an address
        return false
    }

    if (/^0x[0-9a-f]{40}$/.test(tokenAddress) || /^(0x|0X)[0-9A-F]{40}$/.test(tokenAddress)) {
        // If it's all small caps or all all caps, return true
        return true
    }

    return checkAddressCheckSum(tokenAddress)
}
