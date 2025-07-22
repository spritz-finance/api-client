import { z } from 'zod'

export const DebitCardValidation = z.object({
    name: z.string().min(1, 'Name is required').nullable().optional(),
    cardNumber: z.string().regex(/^\d{13,19}$/, 'Card number must be between 13 and 19 digits'),
    expirationDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiration date must be in MM/YY format'),
})

export type ValidatedDebitCardInput = z.infer<typeof DebitCardValidation>