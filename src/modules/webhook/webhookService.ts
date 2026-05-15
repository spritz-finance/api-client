import { SpritzClient } from '../../lib/client'
import { restRoute } from '../../rest/route'
import type { PathRequestBody, PathResponse } from '../../rest/types'

type RestCreateWebhookRequest = PathRequestBody<'/v1/integrator/webhooks', 'post'>
type RestIntegratorWebhook = PathResponse<'/v1/integrator/webhooks', 'post'>
type RestIntegratorWebhookList = PathResponse<'/v1/integrator/webhooks', 'get'>
type RestUpdatedIntegratorWebhook = PathResponse<'/v1/integrator/webhooks/{webhookId}', 'patch'>

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

export type UpdateWebhookParams = {
    events: WebhookEvent[]
}

export type UpdateWebhookSecretResponse = {
    success: boolean
}

function normalizeWebhook(
    webhook:
        | RestIntegratorWebhook
        | RestUpdatedIntegratorWebhook
        | RestIntegratorWebhookList[number]
) {
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
        const webhook = await this.client.restApi(
            restRoute('/v1/integrator/webhooks', 'post', {
                body: args,
            })
        )

        return normalizeWebhook(webhook)
    }

    public async update(webhookId: string, args: UpdateWebhookParams) {
        const webhook = await this.client.restApi(
            restRoute('/v1/integrator/webhooks/{webhookId}', 'patch', {
                params: { webhookId },
                body: args,
            })
        )

        return normalizeWebhook(webhook)
    }

    public async updateWebhookSecret(secret: string) {
        const response = await this.client.restApi(
            restRoute('/v1/integrator/webhook-secret', 'post', {
                body: { secret },
            })
        )

        return { success: response.secretConfigured }
    }

    public async list() {
        const webhooks = await this.client.restApi(restRoute('/v1/integrator/webhooks', 'get'))

        return webhooks.map(normalizeWebhook)
    }

    public async delete(webhookId: string) {
        const existingWebhook = await this.list()
            .then((webhooks) => webhooks.find((webhook) => webhook.id === webhookId))
            .catch(() => undefined)

        await this.client.restApi(
            restRoute('/v1/integrator/webhooks/{webhookId}', 'delete', {
                params: { webhookId },
            })
        )

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
