import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebhookService } from './webhookService'
import { SpritzClient } from '../../lib/client'

describe('WebhookService', () => {
    let webhookService: WebhookService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            request: vi.fn(),
        } as unknown as SpritzClient

        webhookService = new WebhookService(mockClient)
    })

    describe('create', () => {
        it('should create a webhook', async () => {
            const mockWebhook = {
                id: 'webhook-123',
                integratorId: 'integrator-123',
                failureCount: 0,
                events: ['payment.created', 'payment.completed'],
                url: 'https://example.com/webhook',
                createdAt: '2024-01-01T00:00:00Z',
            }

            vi.mocked(mockClient.request).mockResolvedValue(mockWebhook)

            const result = await webhookService.create({
                url: 'https://example.com/webhook',
                events: ['payment.created', 'payment.completed'],
            })

            expect(mockClient.request).toHaveBeenCalledWith({
                method: 'post',
                path: '/users/integrators/webhooks',
                body: {
                    url: 'https://example.com/webhook',
                    events: ['payment.created', 'payment.completed'],
                },
            })
            expect(result).toEqual(mockWebhook)
        })
    })

    describe('updateWebhookSecret', () => {
        it('should update webhook secret', async () => {
            const mockResponse = { success: true }
            vi.mocked(mockClient.request).mockResolvedValue(mockResponse)

            const result = await webhookService.updateWebhookSecret('new-secret')

            expect(mockClient.request).toHaveBeenCalledWith({
                method: 'post',
                path: '/users/integrators/webhook-secret',
                body: { secret: 'new-secret' },
            })
            expect(result).toEqual(mockResponse)
        })
    })

    describe('list', () => {
        it('should list all webhooks', async () => {
            const mockWebhooks = [
                {
                    id: 'webhook-1',
                    integratorId: 'integrator-123',
                    failureCount: 0,
                    events: ['payment.created'],
                    url: 'https://example.com/webhook1',
                    createdAt: '2024-01-01T00:00:00Z',
                },
                {
                    id: 'webhook-2',
                    integratorId: 'integrator-123',
                    failureCount: 2,
                    events: ['account.created', 'account.updated'],
                    url: 'https://example.com/webhook2',
                    createdAt: '2024-01-02T00:00:00Z',
                },
            ]

            vi.mocked(mockClient.request).mockResolvedValue(mockWebhooks)

            const result = await webhookService.list()

            expect(mockClient.request).toHaveBeenCalledWith({
                method: 'get',
                path: '/users/integrators/webhooks',
            })
            expect(result).toEqual(mockWebhooks)
        })
    })

    describe('delete', () => {
        it('should delete a webhook by id', async () => {
            const mockDeletedWebhook = {
                id: 'webhook-123',
                integratorId: 'integrator-123',
                failureCount: 0,
                events: ['payment.created', 'payment.completed'],
                url: 'https://example.com/webhook',
                createdAt: '2024-01-01T00:00:00Z',
            }
            vi.mocked(mockClient.request).mockResolvedValue(mockDeletedWebhook)

            const result = await webhookService.delete('webhook-123')

            expect(mockClient.request).toHaveBeenCalledWith({
                method: 'delete',
                path: '/users/integrators/webhooks/webhook-123',
            })
            expect(result).toEqual(mockDeletedWebhook)
        })
    })
})
