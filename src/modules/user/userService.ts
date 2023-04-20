import CurrentUserQuery from '../../graph/queries/currentUser.graphql'
import UserVerificationQuery from '../../graph/queries/verification.graphql'
import { CurrentUser } from '../../graph/queries/__types__/CurrentUser'
import { GraphClient } from '../../lib/client'
import { UserVerification } from '../../graph/queries/__types__'

export class UserService {
    private client: GraphClient

    constructor(client: GraphClient) {
        this.client = client
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
