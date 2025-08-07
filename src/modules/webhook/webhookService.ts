import { SpritzClient } from '../../lib/client'

export type WebhookEvent =
    | 'account.created'
    | 'account.updated'
    | 'account.deleted'
    | 'payment.created'
    | 'payment.updated'
    | 'payment.completed'
    | 'payment.refunded'
    | 'verification.status.updated'

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

    public async updateWebhookSecret(secret: string) {
        return this.client.request<{ success: boolean }, { secret: string }>({
            method: 'post',
            path: '/users/integrators/webhook-secret',
            body: { secret },
        })
    }

    public async list() {
        return this.client.request<IntegratorWebhook[]>({
            method: 'get',
            path: '/users/integrators/webhooks',
        })
    }

    public async delete(webhookId: string) {
        return this.client.request<IntegratorWebhook>({
            method: 'delete',
            path: `/users/integrators/webhooks/${webhookId}`,
        })
    }
}
