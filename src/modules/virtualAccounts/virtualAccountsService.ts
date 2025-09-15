import {
    CreateVirtualAccount,
    CreateVirtualAccountVariables,
} from '../../graph/mutations/__types__/CreateVirtualAccount'
import CreateVirtualAccountQuery from '../../graph/mutations/createVirtualAccount.graphql'
import { VirtualAccounts } from '../../graph/queries/__types__/VirtualAccounts'
import VirtualAccountsQuery from '../../graph/queries/virtualAccounts.graphql'
import { SpritzClient } from '../../lib/client'
import { CreateVirtualAccountInput, validateCreateVirtualAccountInput } from './types'

export class VirtualAccountsService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async list() {
        const response = await this.client.query<VirtualAccounts>({
            query: VirtualAccountsQuery,
        })
        return response.virtualAccounts
    }

    public async create(input: CreateVirtualAccountInput) {
        validateCreateVirtualAccountInput(input)

        const response = await this.client.query<
            CreateVirtualAccount,
            CreateVirtualAccountVariables
        >({
            query: CreateVirtualAccountQuery,
            variables: {
                network: input.network,
                address: input.address,
                token: input.token,
            },
        })
        return response.createVirtualAccount
    }
}
