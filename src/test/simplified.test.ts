import { describe, it, expect } from 'vitest'
import { SpritzApiClient } from '../spritzApiClient'
import { Environment } from '../env'
import { isValidEthereumAddress } from '../utils/address'

describe('Spritz API Client - Core Functionality', () => {
    const client = SpritzApiClient.initialize({
        environment: Environment.Sandbox,
        apiKey: 'ak_test_key',
        integrationKey: 'ik_test_key',
        dangerouslyAllowBrowser: true,
    })

    describe('Client initialization', () => {
        it('should initialize with valid configuration', () => {
            expect(client).toBeInstanceOf(SpritzApiClient)
        })
    })

    describe('Address validation', () => {
        it('should validate valid Ethereum addresses', () => {
            const validAddress = '0x6C6384490e2Dd490E7AA5B95C1Bf5a2137dA12c3'
            expect(isValidEthereumAddress(validAddress)).toBe(true)
        })

        it('should reject invalid addresses', () => {
            expect(isValidEthereumAddress('invalid')).toBe(false)
            expect(isValidEthereumAddress('')).toBe(false)
            expect(isValidEthereumAddress(null as any)).toBe(false)
        })
    })

    describe('User service', () => {
        it('should get current user', async () => {
            const result = await client.user.getCurrentUser()
            expect(result).toBeTruthy()
            expect(result).toHaveProperty('id')
            expect(result).toHaveProperty('email')
            expect(result.id).toBe('user-123')
            expect(result.email).toBe('test@example.com')
        })
    })

    describe('Payment request service', () => {
        it('should create payment request', async () => {
            const result = await client.paymentRequest.create({
                accountId: 'bank-account-123',
                amount: 100,
                network: 'ethereum',
            })
            expect(result).toHaveProperty('id')
            expect(result).toHaveProperty('status')
        })

        it('should get web3 payment params', async () => {
            const paymentRequest = {
                id: 'payment-request-123',
                amountDue: 100,
                network: 'ethereum',
            }
            const result = await client.paymentRequest.getWeb3PaymentParams({
                paymentRequest: paymentRequest as any,
                paymentTokenAddress: '0x6C6384490e2Dd490E7AA5B95C1Bf5a2137dA12c3',
            })
            expect(result).toHaveProperty('contractAddress')
            expect(result).toHaveProperty('method')
            expect(result).toHaveProperty('calldata')
        })
    })

    describe('Bank account service', () => {
        it('should get user bank accounts', async () => {
            const result = await client.bankAccount.list()
            expect(Array.isArray(result)).toBe(true)
            if (result.length > 0) {
                expect(result[0]).toHaveProperty('id')
                expect(result[0]).toHaveProperty('name')
            }
        })
    })

    describe('Payment service', () => {
        it('should get payment for payment request', async () => {
            const result = await client.payment.getForPaymentRequest('payment-request-123')
            expect(result).toBeTruthy()
            expect(result).toHaveProperty('id')
            expect(result).toHaveProperty('status')
            expect(result.id).toBe('payment-123')
            expect(result.status).toBe('COMPLETED')
        })
    })

    describe('Debit card service', () => {
        it('should list debit cards', async () => {
            const result = await client.debitCard.list()
            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(2)
            expect(result[0]).toHaveProperty('id')
            expect(result[0]).toHaveProperty('name')
            expect(result[0]).toHaveProperty('cardNumber')
            expect(result[0]).toHaveProperty('expirationDate')
        })

        it('should create a debit card', async () => {
            const result = await client.debitCard.create({
                name: 'Test Debit Card',
                cardNumber: '4111111111111111',
                expirationDate: '12/25',
            })
            expect(result).toHaveProperty('id')
            expect(result).toHaveProperty('name')
            expect(result?.name).toBe('Test Debit Card')
            expect(result?.cardNumber).toBe('4111111111111111')
            expect(result?.expirationDate).toBe('12/25')
        })

        it('should rename a debit card', async () => {
            const result = await client.debitCard.rename('debit-card-123', 'Updated Card Name')
            expect(result).toHaveProperty('id')
            expect(result).toHaveProperty('name')
            expect(result?.name).toBe('Updated Card Name')
        })

        it('should delete a debit card', async () => {
            const result = await client.debitCard.delete('debit-card-123')
            expect(result).toHaveProperty('id')
            expect(result?.id).toBe('debit-card-123')
        })
    })
})
