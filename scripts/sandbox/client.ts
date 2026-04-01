import { SpritzApiClient, Environment } from '../../dist/spritz-api-client.mjs'
import { SpritzClient } from '../../src/lib/client'
import { requireEnv, optionalEnv } from './env'

/**
 * High-level client for service methods (GraphQL + typed REST via services).
 */
export function createClient(apiKey?: string) {
    const integrationKey = requireEnv('SPRITZ_INTEGRATION_KEY')
    const integratorSecret = requireEnv('SPRITZ_INTEGRATOR_SECRET')
    const key = apiKey ?? optionalEnv('SPRITZ_API_KEY')

    return SpritzApiClient.initialize({
        environment: Environment.Sandbox,
        integrationKey,
        integratorSecret,
        apiKey: key,
    })
}

/**
 * Low-level client for direct REST API calls (HMAC-signed).
 * Use for endpoints not yet wrapped in a service.
 */
export function createRestClient(apiKey?: string) {
    const integrationKey = requireEnv('SPRITZ_INTEGRATION_KEY')
    const integratorSecret = requireEnv('SPRITZ_INTEGRATOR_SECRET')
    const key = apiKey ?? optionalEnv('SPRITZ_API_KEY')

    return new SpritzClient({
        environment: 'staging',
        integrationKey,
        integratorSecret,
        apiKey: key,
    })
}
