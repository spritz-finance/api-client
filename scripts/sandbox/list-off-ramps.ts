/**
 * List off-ramps via the REST API (HMAC-signed, with query params).
 *
 * Usage:
 *   ./scripts/sandbox/run.sh list-off-ramps
 *   ./scripts/sandbox/run.sh list-off-ramps --status=completed
 *   ./scripts/sandbox/run.sh list-off-ramps --chain=ethereum --limit=5
 *
 * Requires SPRITZ_API_KEY in .env
 */
import { createClient } from './client'
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
    requireEnv('SPRITZ_API_KEY')
    const query = parseArgs(process.argv.slice(2))

    console.log('=== Off-Ramps (REST API) ===')
    if (Object.keys(query).length > 0) {
        console.log('Filters:', query)
    }

    const client = createClient()
    const offRamps = await client.restApi({
        method: 'get',
        path: '/v1/off-ramps/',
        query,
    })
    console.log(JSON.stringify(offRamps, null, 2))
}

main().catch((err) => {
    console.error('Failed:', err.message ?? err)
    process.exit(1)
})
