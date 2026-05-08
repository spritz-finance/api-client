import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebhookService } from './webhookService'
import { SpritzClient } from '../../lib/client'

describe('WebhookService', () => {
    let webhookService: WebhookService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        webhookService = new WebhookService(mockClient)
    })

    describe('create', () => {
        it('should create a webhook', async () => {
            const mockWebhook = {
                id: 'webhook-123',
                failureCount: 0,
                events: ['onramp.created', 'onramp.updated'],
                url: 'https://example.com/webhook',
                disabled: false,
            }

            vi.mocked(mockClient.restApi).mockResolvedValue(mockWebhook)

            const result = await webhookService.create({
                url: 'https://example.com/webhook',
                events: ['onramp.created', 'onramp.updated'],
            })

            expect(mockClient.restApi).toHaveBeenCalledWith({
                method: 'post',
                path: '/v1/integrator/webhooks',
                body: {
                    url: 'https://example.com/webhook',
                    events: ['onramp.created', 'onramp.updated'],
                },
            })
            expect(result).toEqual({
                ...mockWebhook,
                integratorId: '',
                createdAt: '',
            })
        })

        it('should preserve legacy webhook fields when the API includes them', async () => {
            const mockWebhook = {
                id: 'webhook-123',
                integratorId: 'integrator-123',
                failureCount: 0,
                events: ['payment.created'],
                url: 'https://example.com/webhook',
                createdAt: '2024-01-01T00:00:00Z',
                disabled: false,
            }

            vi.mocked(mockClient.restApi).mockResolvedValue(mockWebhook)

            const result = await webhookService.create({
                url: 'https://example.com/webhook',
                events: ['payment.created'],
            })

            expect(result).toEqual(mockWebhook)
        })
    })

    describe('update', () => {
        it('should update webhook event subscriptions', async () => {
            const mockWebhook = {
                id: 'webhook/123',
                failureCount: 0,
                events: ['achDebitReturn.created', 'achDebitReturn.updated'],
                url: 'https://example.com/webhook',
                disabled: false,
            }

            vi.mocked(mockClient.restApi).mockResolvedValue(mockWebhook)

            const result = await webhookService.update('webhook/123', {
                events: ['achDebitReturn.created', 'achDebitReturn.updated'],
            })

            expect(mockClient.restApi).toHaveBeenCalledWith({
                method: 'patch',
                path: '/v1/integrator/webhooks/webhook%2F123',
                body: {
                    events: ['achDebitReturn.created', 'achDebitReturn.updated'],
                },
            })
            expect(result).toEqual({
                ...mockWebhook,
                integratorId: '',
                createdAt: '',
            })
        })

        it('should support subscribing to all webhook events', async () => {
            const mockWebhook = {
                id: 'webhook-123',
                failureCount: 0,
                events: ['*'],
                url: 'https://example.com/webhook',
                disabled: false,
            }

            vi.mocked(mockClient.restApi).mockResolvedValue(mockWebhook)

            const result = await webhookService.update('webhook-123', {
                events: ['*'],
            })

            expect(mockClient.restApi).toHaveBeenCalledWith({
                method: 'patch',
                path: '/v1/integrator/webhooks/webhook-123',
                body: {
                    events: ['*'],
                },
            })
            expect(result.events).toEqual(['*'])
        })
    })

    describe('updateWebhookSecret', () => {
        it('should update webhook secret', async () => {
            const mockResponse = { secretConfigured: true }
            vi.mocked(mockClient.restApi).mockResolvedValue(mockResponse)

            const result = await webhookService.updateWebhookSecret('new-secret')

            expect(mockClient.restApi).toHaveBeenCalledWith({
                method: 'post',
                path: '/v1/integrator/webhook-secret',
                body: { secret: 'new-secret' },
            })
            expect(result).toEqual({ success: true })
        })
    })

    describe('list', () => {
        it('should list all webhooks', async () => {
            const mockWebhooks = [
                {
                    id: 'webhook-1',
                    failureCount: 0,
                    events: ['payment.created'],
                    url: 'https://example.com/webhook1',
                    disabled: false,
                },
                {
                    id: 'webhook-2',
                    failureCount: 2,
                    events: ['account.created', 'account.updated'],
                    url: 'https://example.com/webhook2',
                    disabled: true,
                },
            ]

            vi.mocked(mockClient.restApi).mockResolvedValue(mockWebhooks)

            const result = await webhookService.list()

            expect(mockClient.restApi).toHaveBeenCalledWith({
                method: 'get',
                path: '/v1/integrator/webhooks',
            })
            expect(result).toEqual([
                {
                    ...mockWebhooks[0],
                    integratorId: '',
                    createdAt: '',
                },
                {
                    ...mockWebhooks[1],
                    integratorId: '',
                    createdAt: '',
                },
            ])
        })
    })

    describe('delete', () => {
        it('should delete a webhook by id', async () => {
            const existingWebhook = {
                id: 'webhook/123',
                failureCount: 0,
                events: ['payment.completed'],
                url: 'https://example.com/webhook',
                disabled: false,
            }
            const mockDeletedWebhook = {
                id: 'webhook/123',
                deleted: true,
            }
            vi.mocked(mockClient.restApi)
                .mockResolvedValueOnce([existingWebhook])
                .mockResolvedValueOnce(mockDeletedWebhook)

            const result = await webhookService.delete('webhook/123')

            expect(mockClient.restApi).toHaveBeenNthCalledWith(1, {
                method: 'get',
                path: '/v1/integrator/webhooks',
            })
            expect(mockClient.restApi).toHaveBeenNthCalledWith(2, {
                method: 'delete',
                path: '/v1/integrator/webhooks/webhook%2F123',
            })
            expect(result).toEqual({
                ...existingWebhook,
                integratorId: '',
                createdAt: '',
            })
        })
    })
})
