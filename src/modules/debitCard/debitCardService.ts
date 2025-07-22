import {
    CreateDebitCard,
    CreateDebitCardVariables,
} from '../../graph/mutations/__types__/CreateDebitCard'
import {
    DeletePayableAccount,
    DeletePayableAccountVariables,
    DeletePayableAccount_deletePayableAccount_DebitCard,
} from '../../graph/mutations/__types__/DeletePayableAccount'
import {
    RenameDebitCard,
    RenameDebitCardVariables,
    RenameDebitCard_renamePayableAccount_DebitCard,
} from '../../graph/mutations/__types__/RenameDebitCard'
import CreateDebitCardMutation from '../../graph/mutations/createDebitCard.graphql'
import DeletePayableAccountMutation from '../../graph/mutations/deletePayableAccount.graphql'
import RenameDebitCardMutation from '../../graph/mutations/renameDebitCard.graphql'
import { UserDebitCards } from '../../graph/queries/__types__'
import UserDebitCardsQuery from '../../graph/queries/debitCards.graphql'
import { SpritzClient } from '../../lib/client'
import { DebitCardInput } from '../../types/globalTypes'
import { DebitCardValidation } from './validation'

export class DebitCardService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async list() {
        const response = await this.client.query<UserDebitCards>({
            query: UserDebitCardsQuery,
        })
        return response?.debitCards ?? []
    }

    public async rename(accountId: string, name: string) {
        const response = await this.client.query<RenameDebitCard, RenameDebitCardVariables>({
            query: RenameDebitCardMutation,
            variables: {
                accountId,
                name,
            },
        })
        return (
            (response?.renamePayableAccount as RenameDebitCard_renamePayableAccount_DebitCard) ??
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
            (response?.deletePayableAccount as DeletePayableAccount_deletePayableAccount_DebitCard) ??
            null
        )
    }

    public async create(input: DebitCardInput) {
        try {
            const validatedInput = DebitCardValidation.parse(input)
            const response = await this.client.query<CreateDebitCard, CreateDebitCardVariables>({
                query: CreateDebitCardMutation,
                variables: {
                    createDebitCardInput: {
                        ...input,
                        cardNumber: validatedInput.cardNumber, // Use the transformed card number
                    },
                },
            })

            return response?.createDebitCard ?? null
        } catch (err) {
            if (err instanceof Error && 'issues' in err) {
                const zodError = err as any
                throw new Error(zodError?.issues?.[0]?.message ?? 'Input validation failure')
            }
            throw err
        }
    }
}
