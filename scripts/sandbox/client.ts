import { SpritzApiClient, Environment } from '../../dist/spritz-api-client.mjs'
import { requireEnv, optionalEnv } from './env'

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
