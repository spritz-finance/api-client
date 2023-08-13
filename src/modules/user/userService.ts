import axios from 'axios'
import { CurrentUser, UserVerification } from '../../graph/queries/__types__'
import CurrentUserQuery from '../../graph/queries/currentUser.graphql'
import UserVerificationQuery from '../../graph/queries/verification.graphql'
import { GraphClient, SpritzApiError } from '../../lib/client'

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
        try {
            const { data } = await this.client.baseClient.post<CreateUserResponse>(
                `/users/integration`,
                args
            )
            return data
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data ?? error.message ?? 'Unknown Error'
                throw new SpritzApiError(`Spritz Request Error: ${message}`)
            } else {
                throw new SpritzApiError(`Spritz Request Error: ${error.message}`)
            }
        }
    }

    public async create(args: CreateUserArgs) {
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
