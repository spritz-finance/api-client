import { CurrentUser, CurrentUser_me } from '../../graph/queries/__types__/CurrentUser'
import { GraphClient } from '../../lib/client'
import CurrentUserQuery from '../../graph/queries/currentUser.graphql'

export class UserService {
    private client: GraphClient

    constructor(client: GraphClient) {
        this.client = client
    }

    public async getCurrentUser() {
        const response = await this.client.query<CurrentUser>({
            query: CurrentUserQuery,
        })

        return response.me as CurrentUser_me
    }
}
