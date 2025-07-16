import { CreateUSVirtualDebitCard } from '../../graph/mutations/__types__/CreateUSVirtualDebitCard'
import CreateUSVirtualDebitCardMutation from '../../graph/mutations/createUSVirtualDebitCard.graphql'
import { UserVirtualDebitCard } from '../../graph/queries/__types__'
import UserVirtualDebitCardQuery from '../../graph/queries/virtualDebitCard.graphql'
import { SpritzClient } from '../../lib/client'
import { VirtualCardType } from '../../types/globalTypes'

type CreateInputMapping = {
    [VirtualCardType.USVirtualDebitCard]: undefined
}

type CreateMutationMapping = {
    [VirtualCardType.USVirtualDebitCard]: {
        query: CreateUSVirtualDebitCard
        variables: undefined
        response: keyof CreateUSVirtualDebitCard
    }
}

const mutationConfig = {
    [VirtualCardType.USVirtualDebitCard]: (
        _input: CreateInputMapping[VirtualCardType.USVirtualDebitCard]
    ) => ({
        query: CreateUSVirtualDebitCardMutation,
        variables: undefined,
        response: 'createUSVirtualDebitCard',
    }),
}

const getCreateMutationConfig = <T extends VirtualCardType>(
    type: T,
    input: CreateInputMapping[T]
) => {
    return mutationConfig[type]?.(input) ?? null
}

export class VirtualCardService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async fetch() {
        const response = await this.client.query<UserVirtualDebitCard>({
            query: UserVirtualDebitCardQuery,
        })
        return response?.virtualDebitCard ?? null
    }

    public async create<T extends VirtualCardType>(type: T, input?: CreateInputMapping[T]) {
        const config = getCreateMutationConfig(type, input)
        if (!config) throw new Error('Invalid virtual card type')

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
