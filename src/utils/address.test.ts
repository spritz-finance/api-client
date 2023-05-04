import { isValidEthereumAddress } from './address'

const checksummedAddresses = [
    '0x6C6384490e2Dd490E7AA5B95C1Bf5a2137dA12c3',
    '0xC35A6fd37bD2B77354fdF483DCa746Eb8b5D2A32',
    '0xe1f98C54Ceb87de2Dc56593F0FE0B5ce46C7a3Dd',
    '0xD7c48599d245Dd975390ffD1760A80E04777b047',
    '0x4DB088dA1f87083a388d1cAb24C46555ceb80b79',
]

const invalidChecksummedAddresses = [
    '0x6C6384490e2Dd490E7AA5B95c1Bf5a2137dA12c3',
    '0xC35A6fd37Bd2b77354fdF483DCa746Eb8b5D2A32',
    '0xe1F98C54Ceb87de2dc56593F0FE0B5ce46C7a3Dd',
    '0xD7c48599d245Dd975390fFd1760A80E04777b047',
    '0x4Db088dA1F87083a388D1cAb24C46555ceb80b79',
]

describe('isValidEthereumAddress', () => {
    it('validates checksummed Ethereum addresses', () => {
        checksummedAddresses.forEach((address) => {
            expect(isValidEthereumAddress(address)).toBe(true)
        })
    })

    it('returns false for addresses with incorrect length', () => {
        const invalidLengthAddresses = [
            '0x742d35Cc6634C0532925a3b844Bc454e4438f44',
            '0x32Be343B94f860124dC4fEe278FDCBD38C102D8822',
        ]

        invalidLengthAddresses.forEach((address) => {
            expect(isValidEthereumAddress(address)).toBe(false)
        })
    })

    it('returns false for addresses with invalid characters', () => {
        const invalidCharAddresses = [
            '0x742d35Cc6634C0532925a3b844Bc454e4438f44g',
            '0x32Be343B94f860124dC4fEe278FDCBD38C102D8Z',
        ]

        invalidCharAddresses.forEach((address) => {
            expect(isValidEthereumAddress(address)).toBe(false)
        })
    })

    it('returns false for addresses with incorrect checksum', () => {
        invalidChecksummedAddresses.forEach((address) => {
            expect(isValidEthereumAddress(address)).toBe(false)
        })
    })

    it('returns true for all caps correct addresses', () => {
        checksummedAddresses
            .map((addr) => addr.toUpperCase())
            .forEach((address) => {
                expect(isValidEthereumAddress(address)).toBe(true)
            })
    })

    it('returns true for lowercase correct addresses', () => {
        checksummedAddresses
            .map((addr) => addr.toLowerCase())
            .forEach((address) => {
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
