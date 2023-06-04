import CurrentUserQuery from '../../graph/queries/currentUser.graphql'
import UserVerificationQuery from '../../graph/queries/verification.graphql'
import { CurrentUser } from '../../graph/queries/__types__'
import { GraphClient } from '../../lib/client'
import { UserVerification } from '../../graph/queries/__types__'

interface CreateUserResponse {
    userId: string
    email: string
    apiKey: string
}

interface CreateUserArgs {
    email: string
}

export class UserService {
    private client: GraphClient

    constructor(client: GraphClient) {
        this.client = client
    }

    public async createUser(args: CreateUserArgs) {
        const { data } = await this.client.baseClient.post<CreateUserResponse>(
            `/users/integration`,
            args
        )
        return data
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
