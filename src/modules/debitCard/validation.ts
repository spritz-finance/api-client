import { z } from 'zod'

const visaPattern = /^4[0-9]{12}(?:[0-9]{3})?$/
const mastercardPattern = /^5[1-5][0-9]{14}$/

export const DebitCardValidation = z.object({
    name: z.string().min(1, 'Name is required').nullable().optional(),
    cardNumber: z
        .string()
        .min(1, 'Card number is required')
        .transform((value) => value.replace(/[^\d]/g, ''))
        .refine(
            (value) =>
                (visaPattern.test(value) || mastercardPattern.test(value)) && value.length === 16,
            'Card must be a valid 16-digit Visa or Mastercard number'
        ),
    expirationDate: z
        .string()
        .min(1, 'Expiration date is required')
        .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiration date must be in MM/YY format'),
})

export type ValidatedDebitCardInput = z.infer<typeof DebitCardValidation>