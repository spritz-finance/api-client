import CurrentUserQuery from '../../graph/queries/currentUser.graphql'
import { CurrentUser } from '../../graph/queries/__types__/CurrentUser'
import { GraphClient } from '../../lib/client'

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
}
