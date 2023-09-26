import { z } from 'zod'
import { BankAccountType } from '../../types/globalTypes'

const CABankAccountDetailsValidation = z.object({
    transitNumber: z
        .string()
        .length(5, { message: 'Transit number must be exactly 5 characters long' })
        .regex(/^[0-9]{5}$/, 'Transit number should contain only digits.'),
    institutionNumber: z
        .string()
        .length(3, { message: 'Institution number must be exactly 3 characters long' })
        .regex(/^[0-9]{3}$/, 'Institution number should contain only digits.'),
})

const USBankAccountDetailsValidation = z.object({
    routingNumber: z
        .string()
        .length(9, { message: 'Routing number must be exactly 9 characters long' })
        .regex(/^[0-9]{9}$/, 'Routing number should contain only digits.'),
})

export const BankAccountDetailsValidation: Record<BankAccountType, z.ZodObject<any>> = {
    [BankAccountType.CABankAccount]: CABankAccountDetailsValidation,
    [BankAccountType.USBankAccount]: USBankAccountDetailsValidation,
}
