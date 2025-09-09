import {
    AcceptTermsOfService,
    AcceptTermsOfServiceVariables,
} from '../../graph/mutations/__types__/AcceptTermsOfService'
import AcceptTermsOfServiceQuery from '../../graph/mutations/acceptTermsOfService.graphql'
import { SpritzClient } from '../../lib/client'

export class OnrampService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async acceptTermsOfService(agreementId: string) {
        const response = await this.client.query<
            AcceptTermsOfService,
            AcceptTermsOfServiceVariables
        >({
            query: AcceptTermsOfServiceQuery,
            variables: { agreementId },
        })
        return response.setBridgeUserAgreementId
    }
}
