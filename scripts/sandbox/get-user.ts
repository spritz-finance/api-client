/**
 * Fetch the current user profile via GraphQL.
 *
 * Usage:
 *   npx tsx scripts/sandbox/get-user.ts
 *
 * Requires SPRITZ_API_KEY in .env
 */
import { createClient } from './client'
import { requireEnv } from './env'

async function main() {
    requireEnv('SPRITZ_API_KEY')
    const client = createClient()

    console.log('Fetching current user (GraphQL)...')
    const user = await client.user.getCurrentUser()
    console.log(JSON.stringify(user, null, 2))
}

main().catch((err) => {
    console.error('Failed:', err.message ?? err)
    process.exit(1)
})
