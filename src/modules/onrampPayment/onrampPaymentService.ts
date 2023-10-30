import CreateOnrampPaymentMutation from '../../graph/mutations/createOnrampPayment.graphql'
import OnrampPaymentsQuery from '../../graph/queries/onrampPayment.graphql'
import { SpritzClient } from '../../lib/client'
import { CreateOnrampPaymentInput } from '../../types/globalTypes'
import {
    CreateOnrampPayment,
    CreateOnrampPaymentVariables,
} from '../../graph/mutations/__types__/CreateOnrampPayment'
import { OnrampPayments } from '../../graph/queries/__types__'

export class OnrampPaymentService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async create(createOnrampPaymentInput: CreateOnrampPaymentInput) {
        const response = await this.client.query<CreateOnrampPayment, CreateOnrampPaymentVariables>(
            {
                query: CreateOnrampPaymentMutation,
                variables: {
                    createOnrampPaymentInput,
                },
            }
        )

        return response?.createOnrampPayment
    }

    public async list() {
        const response = await this.client.query<OnrampPayments>({
            query: OnrampPaymentsQuery,
        })
        return response?.onrampPayments
    }
}
