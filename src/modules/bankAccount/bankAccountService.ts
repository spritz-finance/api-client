import { z } from 'zod'
import {
    CreateBankAccount,
    CreateBankAccountVariables,
} from '../../graph/mutations/__types__/CreateBankAccount'
import {
    DeletePayableAccount,
    DeletePayableAccountVariables,
    DeletePayableAccount_deletePayableAccount_BankAccount,
} from '../../graph/mutations/__types__/DeletePayableAccount'
import {
    RenameBankAccount,
    RenameBankAccountVariables,
    RenameBankAccount_renamePayableAccount_BankAccount,
} from '../../graph/mutations/__types__/RenameBankAccount'
import CreateBankAccountMutation from '../../graph/mutations/createBankAccount.graphql'
import DeletePayableAccountMutation from '../../graph/mutations/deletePayableAccount.graphql'
import RenameBankAccountMutation from '../../graph/mutations/renameBankAccount.graphql'
import { UserBankAccounts } from '../../graph/queries/__types__'
import UserBankAccountsQuery from '../../graph/queries/bankAccounts.graphql'
import { SpritzClient } from '../../lib/client'
import { BankAccountInput, BankAccountType } from '../../types/globalTypes'
import { raise } from '../../utils/raise'
import { BankAccountDetailsValidation } from './validation'

type BaseBankAccountInput = Omit<BankAccountInput, 'details' | 'type'>

export type UsBankAccountInput = BaseBankAccountInput & {
    routingNumber: string
}

export type CaBankAccountInput = BaseBankAccountInput & {
    transitNumber: string
    institutionNumber: string
}

type CreateInputMapping = {
    [BankAccountType.USBankAccount]: UsBankAccountInput
    [BankAccountType.CABankAccount]: CaBankAccountInput
}

export class BankAccountService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async list() {
        const response = await this.client.query<UserBankAccounts>({
            query: UserBankAccountsQuery,
        })
        return response?.bankAccounts ?? []
    }

    public async rename(accountId: string, name: string) {
        const response = await this.client.query<RenameBankAccount, RenameBankAccountVariables>({
            query: RenameBankAccountMutation,
            variables: {
                accountId,
                name,
            },
        })
        return (
            (response?.renamePayableAccount as RenameBankAccount_renamePayableAccount_BankAccount) ??
            null
        )
    }

    public async delete(accountId: string) {
        const response = await this.client.query<
            DeletePayableAccount,
            DeletePayableAccountVariables
        >({
            query: DeletePayableAccountMutation,
            variables: {
                accountId,
            },
        })
        return (
            (response?.deletePayableAccount as DeletePayableAccount_deletePayableAccount_BankAccount) ??
            null
        )
    }

    public async create<T extends BankAccountType>(type: T, input: CreateInputMapping[T]) {
        const validator = BankAccountDetailsValidation[type] ?? raise('Invalid bank account type')

        try {
            const details = validator.parse(input)
            const response = await this.client.query<CreateBankAccount, CreateBankAccountVariables>(
                {
                    query: CreateBankAccountMutation,
                    variables: {
                        createAccountInput: {
                            accountNumber: input.accountNumber,
                            name: input.name,
                            type,
                            subType: input.subType,
                            details,
                            email: input.email ?? null,
                            ownedByUser: input.ownedByUser ?? null,
                            holder: input.holder ?? null,
                        },
                    },
                }
            )

            return response?.createBankAccount ?? null
        } catch (err) {
            if (err instanceof z.ZodError) {
                throw new Error(err?.issues?.[0]?.message ?? 'Input validation failure')
            }
            throw err
        }
    }
}
