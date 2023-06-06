import {
    CreateUSBankAccount,
    CreateUSBankAccountVariables,
} from '../../graph/mutations/__types__/CreateUSBankAccount'
import {
    DeleteBankAccount,
    DeleteBankAccountVariables,
    DeleteBankAccount_deletePayableAccount_BankAccount,
} from '../../graph/mutations/__types__/DeleteBankAccount'
import {
    RenameBankAccount,
    RenameBankAccountVariables,
    RenameBankAccount_renamePayableAccount_BankAccount,
    RenameBankAccount_renamePayableAccount_BankAccount_bankAccountDetails,
} from '../../graph/mutations/__types__/RenameBankAccount'
import CreateUSBankAccountMutation from '../../graph/mutations/createUSBankAccount.graphql'
import DeleteBankAccountMutation from '../../graph/mutations/deleteBankAccount.graphql'
import RenameBankAccountMutation from '../../graph/mutations/renameBankAccount.graphql'
import { UserBankAccounts, UserBankAccounts_bankAccounts } from '../../graph/queries/__types__'
import UserBankAccountsQuery from '../../graph/queries/bankAccounts.graphql'
import { GraphClient } from '../../lib/client'
import { BankAccountType, USBankAccountInput } from '../../types/globalTypes'

type CreateInputMapping = {
    [BankAccountType.USBankAccount]: USBankAccountInput
}

type CreateMutationMapping = {
    [BankAccountType.USBankAccount]: {
        query: CreateUSBankAccount
        variables: CreateUSBankAccountVariables
        response: keyof CreateUSBankAccount
    }
}

const mutationConfig = {
    [BankAccountType.USBankAccount]: (
        input: CreateInputMapping[BankAccountType.USBankAccount]
    ) => ({
        query: CreateUSBankAccountMutation,
        variables: { createUSAccountInput: input },
        response: 'createUSBankAccount',
    }),
}

const getCreateMutationConfig = <T extends BankAccountType>(
    type: T,
    input: CreateInputMapping[T]
) => {
    return mutationConfig[type]?.(input) ?? null
}

export class BankAccountService {
    private client: GraphClient

    constructor(client: GraphClient) {
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
        const response = await this.client.query<DeleteBankAccount, DeleteBankAccountVariables>({
            query: DeleteBankAccountMutation,
            variables: {
                accountId,
            },
        })
        return (
            (response?.deletePayableAccount as DeleteBankAccount_deletePayableAccount_BankAccount) ??
            null
        )
    }

    public async create<T extends BankAccountType>(type: T, input: CreateInputMapping[T]) {
        const config = getCreateMutationConfig(type, input)
        if (!config) throw new Error('Invalid bank account type')

        const response = await this.client.query<
            CreateMutationMapping[T]['query'],
            CreateMutationMapping[T]['variables']
        >({
            query: config.query,
            variables: config.variables,
        })

        return response?.[config.response as keyof CreateMutationMapping[T]['query']] ?? null
    }
}
