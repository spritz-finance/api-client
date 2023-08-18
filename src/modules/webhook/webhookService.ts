import { SpritzClient } from '../../lib/client'

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

type CreateWebhookParams = {
    url: string
    events: WebhookEvent[]
}

export class WebhookService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async create(args: CreateWebhookParams) {
        return this.client.request<IntegratorWebhook, CreateWebhookParams>({
            method: 'post',
            path: '/users/integrators/webhooks',
            body: args,
        })
    }
}
