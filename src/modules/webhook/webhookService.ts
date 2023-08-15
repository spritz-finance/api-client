import axios from 'axios'
import { GraphClient, SpritzApiError } from '../../lib/client'

const EVENTS = [
    'account.created',
    'account.updated',
    'account.deleted',
    'payment.created',
    'payment.updated',
    'payment.completed',
    'payment.refunded',
] as const
export type WebhookEvent = (typeof EVENTS)[number]

export type IntegratorWebhook = {
    id: string
    integratorId: string
    failureCount: number
    events: string[]
    url: string
    createdAt: string
}

type CreateWebhookArgs = {
    url: string
    events: WebhookEvent[]
}

export class WebhookService {
    private client: GraphClient

    constructor(client: GraphClient) {
        this.client = client
    }

    public async create(args: CreateWebhookArgs) {
        try {
            const { data } = await this.client.baseClient.post<IntegratorWebhook>(
                `/users/integrators/webhooks`,
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
}
