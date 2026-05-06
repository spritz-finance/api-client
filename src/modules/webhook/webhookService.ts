import { SpritzClient } from '../../lib/client'
import type { PathRequestBody, PathResponse } from '../../rest/types'

type RestCreateWebhookRequest = PathRequestBody<'/v1/integrator/webhooks', 'post'>
type RestIntegratorWebhook = PathResponse<'/v1/integrator/webhooks', 'post'>
type RestIntegratorWebhookList = PathResponse<'/v1/integrator/webhooks', 'get'>
type RestDeletedIntegratorWebhook = PathResponse<'/v1/integrator/webhooks/{webhookId}', 'delete'>
type RestUpdateWebhookSecretRequest = PathRequestBody<'/v1/integrator/webhook-secret', 'post'>
type RestUpdateWebhookSecretResponse = PathResponse<'/v1/integrator/webhook-secret', 'post'>

export type WebhookEvent = NonNullable<RestCreateWebhookRequest['events']>[number]

export type IntegratorWebhook = {
    id: string
    integratorId: string
    failureCount: number
    events: WebhookEvent[]
    url: string
    createdAt: string
    disabled?: boolean
}

export type CreateWebhookParams = {
    url: string
    events: WebhookEvent[]
}

export type UpdateWebhookSecretResponse = {
    success: boolean
}

function normalizeWebhook(webhook: RestIntegratorWebhook | RestIntegratorWebhookList[number]) {
    const maybeLegacyWebhook = webhook as RestIntegratorWebhook & Partial<IntegratorWebhook>

    return {
        id: webhook.id,
        integratorId: maybeLegacyWebhook.integratorId ?? '',
        failureCount: webhook.failureCount,
        events: webhook.events,
        url: webhook.url,
        createdAt: maybeLegacyWebhook.createdAt ?? '',
        disabled: webhook.disabled,
    }
}

export class WebhookService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async create(args: CreateWebhookParams) {
        const webhook = await this.client.restApi<RestIntegratorWebhook, RestCreateWebhookRequest>({
            method: 'post',
            path: '/v1/integrator/webhooks',
            body: args,
        })

        return normalizeWebhook(webhook)
    }

    public async updateWebhookSecret(secret: string) {
        const response = await this.client.restApi<
            RestUpdateWebhookSecretResponse,
            RestUpdateWebhookSecretRequest
        >({
            method: 'post',
            path: '/v1/integrator/webhook-secret',
            body: { secret },
        })

        return { success: response.secretConfigured }
    }

    public async list() {
        const webhooks = await this.client.restApi<RestIntegratorWebhookList>({
            method: 'get',
            path: '/v1/integrator/webhooks',
        })

        return webhooks.map(normalizeWebhook)
    }

    public async delete(webhookId: string) {
        const existingWebhook = await this.list()
            .then((webhooks) => webhooks.find((webhook) => webhook.id === webhookId))
            .catch(() => undefined)

        await this.client.restApi<RestDeletedIntegratorWebhook>({
            method: 'delete',
            path: `/v1/integrator/webhooks/${encodeURIComponent(webhookId)}`,
        })

        return (
            existingWebhook ?? {
                id: webhookId,
                integratorId: '',
                failureCount: 0,
                events: [],
                url: '',
                createdAt: '',
                disabled: true,
            }
        )
    }
}
