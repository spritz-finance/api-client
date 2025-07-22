import { describe, it, expect } from 'vitest'
import { DebitCardValidation } from './validation'

describe('DebitCardValidation', () => {
    it('should validate valid Visa debit card input', () => {
        const validInput = {
            name: 'Test Card',
            cardNumber: '4111111111111111',
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(validInput)
        expect(result.success).toBe(true)
    })

    it('should validate valid Mastercard debit card input', () => {
        const validInput = {
            name: 'Test Card',
            cardNumber: '5555555555554444',
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(validInput)
        expect(result.success).toBe(true)
    })

    it('should strip non-numeric characters from card number', () => {
        const validInput = {
            name: 'Test Card',
            cardNumber: '4111-1111-1111-1111',
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.cardNumber).toBe('4111111111111111')
        }
    })

    it('should strip spaces from card number', () => {
        const validInput = {
            name: 'Test Card',
            cardNumber: '4111 1111 1111 1111',
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.cardNumber).toBe('4111111111111111')
        }
    })

    it('should validate minimal debit card input', () => {
        const validInput = {
            cardNumber: '4111111111111111',
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(validInput)
        expect(result.success).toBe(true)
    })

    it('should accept null name', () => {
        const validInput = {
            name: null,
            cardNumber: '4111111111111111',
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(validInput)
        expect(result.success).toBe(true)
    })

    it('should reject invalid card number - not Visa or Mastercard', () => {
        const invalidInput = {
            name: 'Test Card',
            cardNumber: '3411111111111111', // Starts with 3, not valid
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(invalidInput)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Card must be a valid 16-digit Visa or Mastercard number')
        }
    })

    it('should reject invalid card number - wrong length', () => {
        const invalidInput = {
            name: 'Test Card',
            cardNumber: '411111111111111', // 15 digits
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(invalidInput)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Card must be a valid 16-digit Visa or Mastercard number')
        }
    })

    it('should reject empty card number', () => {
        const invalidInput = {
            name: 'Test Card',
            cardNumber: '',
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(invalidInput)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Card number is required')
        }
    })

    it('should reject invalid Mastercard prefix', () => {
        const invalidInput = {
            name: 'Test Card',
            cardNumber: '5055555555554444', // 50 prefix not valid for Mastercard
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(invalidInput)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Card must be a valid 16-digit Visa or Mastercard number')
        }
    })

    it('should reject invalid expiration date format', () => {
        const invalidInput = {
            name: 'Test Card',
            cardNumber: '4111111111111111',
            expirationDate: '13/25', // Invalid month
        }
        
        const result = DebitCardValidation.safeParse(invalidInput)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Expiration date must be in MM/YY format')
        }
    })

    it('should reject empty expiration date', () => {
        const invalidInput = {
            name: 'Test Card',
            cardNumber: '4111111111111111',
            expirationDate: '',
        }
        
        const result = DebitCardValidation.safeParse(invalidInput)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Expiration date is required')
        }
    })

    it('should reject missing required fields', () => {
        const invalidInput = {
            name: 'Test Card',
        }
        
        const result = DebitCardValidation.safeParse(invalidInput)
        expect(result.success).toBe(false)
    })

    it('should accept various valid Visa card numbers', () => {
        const cardNumbers = [
            '4111111111111111',
            '4012888888881881',
            '4222222222222222',
        ]

        cardNumbers.forEach(cardNumber => {
            const result = DebitCardValidation.safeParse({
                cardNumber,
                expirationDate: '12/25',
            })
            expect(result.success).toBe(true)
        })
    })

    it('should accept various valid Mastercard numbers', () => {
        const cardNumbers = [
            '5111111111111118',
            '5222222222222225',
            '5333333333333339',
            '5444444444444442',
            '5555555555554444',
        ]

        cardNumbers.forEach(cardNumber => {
            const result = DebitCardValidation.safeParse({
                cardNumber,
                expirationDate: '12/25',
            })
            expect(result.success).toBe(true)
        })
    })

    it('should accept various valid expiration dates', () => {
        const expirationDates = [
            '01/25',
            '02/30',
            '09/99',
            '10/00',
            '11/23',
            '12/50',
        ]

        expirationDates.forEach(expirationDate => {
            const result = DebitCardValidation.safeParse({
                cardNumber: '4111111111111111',
                expirationDate,
            })
            expect(result.success).toBe(true)
        })
    })
})