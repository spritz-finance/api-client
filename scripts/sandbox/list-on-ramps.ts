/**
 * List on-ramps via the REST API (HMAC-signed, with query params).
 *
 * Usage:
 *   ./scripts/sandbox/run.sh list-on-ramps
 *   ./scripts/sandbox/run.sh list-on-ramps --network=ethereum --token=USDC
 *
 * Requires SPRITZ_API_KEY in .env
 */
import { createRestClient } from './client'
import { requireEnv } from './env'

function parseArgs(args: string[]): Record<string, string> {
    const result: Record<string, string> = {}
    for (const arg of args) {
        const match = arg.match(/^--(\w+)=(.+)$/)
        if (match) {
            result[match[1]!] = match[2]!
        }
    }
    return result
}

async function main() {
    const apiKey = requireEnv('SPRITZ_API_KEY')
    const query = parseArgs(process.argv.slice(2))

    console.log('=== On-Ramps (REST API) ===')
    if (Object.keys(query).length > 0) {
        console.log('Filters:', query)
    }

    const rest = createRestClient(apiKey)
    const onRamps = await rest.restApi({
        method: 'get',
        path: '/v1/on-ramps/',
        query,
    })
    console.log(JSON.stringify(onRamps, null, 2))
}

main().catch((err) => {
    console.error('Failed:', err.message ?? err)
    process.exit(1)
})
