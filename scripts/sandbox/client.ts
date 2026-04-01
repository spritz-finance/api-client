import { SpritzApiClient, Environment } from '../../dist/spritz-api-client.mjs'
import { SpritzClient } from '../../src/lib/client'
import { Environment as SrcEnvironment } from '../../src/env'
import { requireEnv, optionalEnv } from './env'

function credentials(apiKey?: string) {
    return {
        integrationKey: requireEnv('SPRITZ_INTEGRATION_KEY'),
        integratorSecret: requireEnv('SPRITZ_INTEGRATOR_SECRET'),
        apiKey: apiKey ?? optionalEnv('SPRITZ_API_KEY'),
    }
}

/**
 * High-level client for service methods (GraphQL + typed REST via services).
 */
export function createClient(apiKey?: string) {
    return SpritzApiClient.initialize({
        environment: Environment.Sandbox,
        ...credentials(apiKey),
    })
}

/**
 * Low-level client for direct REST API calls (HMAC-signed).
 * Use for endpoints not yet wrapped in a service.
 */
export function createRestClient(apiKey?: string) {
    return new SpritzClient({
        environment: SrcEnvironment.Sandbox,
        ...credentials(apiKey),
    })
}
