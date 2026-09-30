import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpritzClient } from '../../lib/client'
import { UserService } from './userService'

describe('UserService', () => {
    let userService: UserService
    let mockClient: SpritzClient

    beforeEach(() => {
        mockClient = {
            restApi: vi.fn(),
        } as unknown as SpritzClient

        userService = new UserService(mockClient)
    })

    it('gets the current user profile from the REST API', async () => {
        const profile = {
            id: '6aa831df18ffc49a16151fcf',
            email: 'user@example.com',
            firstName: 'John',
            signedUpAt: '2026-01-01T00:00:00Z',
            timezone: 'America/New_York',
            notificationPreferences: [],
            verification: {
                status: 'not_started',
                country: null,
                requirement: {
                    type: 'identity_verification',
                    retryable: false,
                    status: 'not_started',
                },
            },
            capabilities: [
                {
                    product: 'crypto_to_fiat',
                    method: 'ach_credit',
                    name: 'ACH Bank Transfer',
                    description: 'Sell crypto to a US bank account',
                    status: 'requirements_needed',
                    nextRequirement: 'identity_verification',
                    requirements: [{ type: 'identity_verification', status: 'not_started' }],
                },
            ],
        }

        vi.mocked(mockClient.restApi).mockResolvedValue(profile)

        const result = await userService.getMe()

        expect(mockClient.restApi).toHaveBeenCalledWith({
            method: 'get',
            path: '/v1/users/me',
        })
        expect(result).toEqual(profile)
    })

    it('creates a user on the REST API with integrator HMAC credentials', async () => {
        const integratorClient = {
            restApi: vi.fn(),
            request: vi.fn(),
            usesIntegratorAuth: true,
        } as unknown as SpritzClient
        const service = new UserService(integratorClient)
        const created = { userId: 'usr_123', email: 'user@example.com', apiKey: 'ak_test' }
        vi.mocked(integratorClient.restApi).mockResolvedValue(created)

        const result = await service.create({
            email: 'user@example.com',
            timezone: 'Europe/Berlin',
        })

        expect(integratorClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/integrator/users',
            body: { email: 'user@example.com', timezone: 'Europe/Berlin' },
        })
        expect(integratorClient.request).not.toHaveBeenCalled()
        expect(result).toEqual(created)
    })

    it('omits a null timezone on the REST route', async () => {
        const integratorClient = {
            restApi: vi.fn(),
            request: vi.fn(),
            usesIntegratorAuth: true,
        } as unknown as SpritzClient
        const service = new UserService(integratorClient)
        vi.mocked(integratorClient.restApi).mockResolvedValue({})

        await service.create({ email: 'user@example.com', timezone: null })

        expect(integratorClient.restApi).toHaveBeenCalledWith({
            method: 'post',
            path: '/v1/integrator/users',
            body: { email: 'user@example.com' },
        })
    })

    it('creates a user on the legacy route without an integrator secret', async () => {
        const keyOnlyClient = {
            restApi: vi.fn(),
            request: vi.fn(),
            usesIntegratorAuth: false,
        } as unknown as SpritzClient
        const service = new UserService(keyOnlyClient)
        const created = { userId: 'usr_123', email: 'user@example.com', apiKey: 'ak_test' }
        vi.mocked(keyOnlyClient.request).mockResolvedValue(created)

        const result = await service.create({ email: 'user@example.com' })

        expect(keyOnlyClient.request).toHaveBeenCalledWith({
            method: 'post',
            path: '/users/integration',
            body: { email: 'user@example.com' },
        })
        expect(keyOnlyClient.restApi).not.toHaveBeenCalled()
        expect(result).toEqual(created)
    })
})
