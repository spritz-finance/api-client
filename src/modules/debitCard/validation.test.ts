import { describe, it, expect } from 'vitest'
import { DebitCardValidation } from './validation'

describe('DebitCardValidation', () => {
    it('should validate valid debit card input', () => {
        const validInput = {
            name: 'Test Card',
            cardNumber: '4111111111111111',
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(validInput)
        expect(result.success).toBe(true)
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

    it('should reject invalid card number - too short', () => {
        const invalidInput = {
            name: 'Test Card',
            cardNumber: '411111111111',
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(invalidInput)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Card number must be between 13 and 19 digits')
        }
    })

    it('should reject invalid card number - too long', () => {
        const invalidInput = {
            name: 'Test Card',
            cardNumber: '41111111111111111111',
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(invalidInput)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Card number must be between 13 and 19 digits')
        }
    })

    it('should reject invalid card number - non-numeric', () => {
        const invalidInput = {
            name: 'Test Card',
            cardNumber: '411111111111111a',
            expirationDate: '12/25',
        }
        
        const result = DebitCardValidation.safeParse(invalidInput)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Card number must be between 13 and 19 digits')
        }
    })

    it('should reject invalid expiration date format', () => {
        const invalidInput = {
            name: 'Test Card',
            cardNumber: '4111111111111111',
            expirationDate: '13/25',
        }
        
        const result = DebitCardValidation.safeParse(invalidInput)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Expiration date must be in MM/YY format')
        }
    })

    it('should reject missing required fields', () => {
        const invalidInput = {
            name: 'Test Card',
        }
        
        const result = DebitCardValidation.safeParse(invalidInput)
        expect(result.success).toBe(false)
    })

    it('should accept various valid card numbers', () => {
        const cardNumbers = [
            '4111111111111111', // 16 digits
            '5555555555554444', // 16 digits
            '4111111111111',     // 13 digits
            '4111111111111111111', // 19 digits
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