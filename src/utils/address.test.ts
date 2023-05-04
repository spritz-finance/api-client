import { randomBytes } from 'crypto'
import { isValidEthereumAddress } from './address'
import { privateToAddress, toChecksumAddress } from 'ethereumjs-util'

function generateRandomChecksummedAddress() {
    const privateKey = randomBytes(32)
    const address = privateToAddress(privateKey)
    const checksummedAddress = toChecksumAddress(`0x${address.toString('hex')}`)
    return checksummedAddress
}

function generateNonChecksummedAddress() {
    const privateKey = randomBytes(32)
    const address = privateToAddress(privateKey)
    const checksummedAddress = toChecksumAddress(`0x${address.toString('hex')}`)
    return checksummedAddress.toLowerCase()
}

describe('isValidEthereumAddress', () => {
    test('validates correct Ethereum addresses (strict mode)', () => {
        const checksummedAddresses = Array.from({ length: 100 }).map(() =>
            generateRandomChecksummedAddress()
        )

        checksummedAddresses.forEach((address) => {
            expect(isValidEthereumAddress(address, true)).toBe(true)
        })
    })

    test('validates correct Ethereum addresses (non-strict mode)', () => {
        const validAddresses = [
            '0x742d35cc6634c0532925a3b844bc454e4438f44e',
            '0x32be343b94f860124dc4fee278fdcbd38c102d88',
            '0x6f46cf5569afa4228c72b1e7c8833e4aa2a4a3f2',
            '0x10fab58e6f6042706a882099525a62ee0c03e7e5',
            '0x53d284357ec70ce89df3bb2d291996c9d6f6e99b',
        ]

        validAddresses.forEach((address) => {
            expect(isValidEthereumAddress(address)).toBe(true)
        })
    })

    test('returns false for addresses with incorrect length', () => {
        const invalidLengthAddresses = [
            '0x742d35Cc6634C0532925a3b844Bc454e4438f44',
            '0x32Be343B94f860124dC4fEe278FDCBD38C102D8822',
        ]

        invalidLengthAddresses.forEach((address) => {
            expect(isValidEthereumAddress(address)).toBe(false)
        })
    })

    test('returns false for addresses with invalid characters', () => {
        const invalidCharAddresses = [
            '0x742d35Cc6634C0532925a3b844Bc454e4438f44g',
            '0x32Be343B94f860124dC4fEe278FDCBD38C102D8Z',
        ]

        invalidCharAddresses.forEach((address) => {
            expect(isValidEthereumAddress(address)).toBe(false)
        })
    })

    test('returns false for addresses with incorrect checksum (strict mode)', () => {
        const checksummedAddresses = Array.from({ length: 100 }).map(() =>
            generateNonChecksummedAddress()
        )

        checksummedAddresses.forEach((address) => {
            expect(isValidEthereumAddress(address, true)).toBe(false)
        })
    })

    test('returns true for addresses with incorrect checksum (non-strict mode)', () => {
        const checksummedAddresses = Array.from({ length: 100 }).map(() =>
            generateNonChecksummedAddress()
        )

        checksummedAddresses.forEach((address) => {
            expect(isValidEthereumAddress(address)).toBe(true)
        })
    })

    test('returns false for non-string inputs', () => {
        const nonStringInputs = [
            123,
            null,
            undefined,
            {},
            [],
            () => {
                return true
            },
        ]

        nonStringInputs.forEach((input: any) => {
            expect(isValidEthereumAddress(input)).toBe(false)
        })
    })

    test('returns false for an empty string', () => {
        const tokenAddress = ''
        expect(isValidEthereumAddress(tokenAddress)).toBe(false)
    })

    test('returns false for an address without 0x prefix', () => {
        const tokenAddress = '742d35Cc6634C0532925a3b844Bc454e4438f44e'
        expect(isValidEthereumAddress(tokenAddress)).toBe(false)
    })
})
