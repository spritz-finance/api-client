import { CurrentUser, UserVerification } from '../../graph/queries/__types__'
import CurrentUserQuery from '../../graph/queries/currentUser.graphql'
import UserVerificationQuery from '../../graph/queries/verification.graphql'
import { SpritzClient } from '../../lib/client'

interface CreateUserResponse {
    userId: string
    email: string
    apiKey: string
}

interface CreateUserParams {
    email: string
}

export class UserService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async createUser(args: CreateUserParams) {
        return this.client.request<CreateUserResponse, CreateUserParams>({
            method: 'post',
            path: '/users/integration',
            body: args,
        })
    }

    public async create(args: CreateUserParams) {
        return this.createUser(args)
    }

    public async getCurrentUser() {
        const response = await this.client.query<CurrentUser>({
            query: CurrentUserQuery,
        })

        return response?.me ?? null
    }

    public async getUserVerification() {
        const response = await this.client.query<UserVerification>({
            query: UserVerificationQuery,
        })
        return response?.verification ?? null
    }
}
