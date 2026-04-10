import CreateOnrampPaymentMutation from '../../graph/mutations/createOnrampPayment.graphql'
import { SpritzClient } from '../../lib/client'
import { CreateOnrampPaymentInput } from '../../types/globalTypes'
import {
    CreateOnrampPayment,
    CreateOnrampPaymentVariables,
} from '../../graph/mutations/__types__/CreateOnrampPayment'
import type { PathResponse, PathQuery } from '../../rest/types'

export type OnRampListResponse = PathResponse<'/v1/on-ramps/', 'get'>
export type OnRamp = OnRampListResponse['data'][number]
export type OnRampListQuery = PathQuery<'/v1/on-ramps/', 'get'>

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

    public async list(query?: OnRampListQuery) {
        return this.client.restApi<OnRampListResponse>({
            method: 'get',
            path: '/v1/on-ramps/',
            query: query as Record<string, string | number | boolean | undefined>,
        })
    }
}
