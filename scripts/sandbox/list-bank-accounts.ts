/**
 * List bank accounts via both GraphQL (service) and REST API (HMAC-signed).
 *
 * Usage:
 *   ./scripts/sandbox/run.sh list-bank-accounts
 *
 * Requires SPRITZ_API_KEY in .env
 */
import { createClient, createRestClient } from './client'
import { requireEnv } from './env'

async function main() {
    const apiKey = requireEnv('SPRITZ_API_KEY')
    const client = createClient(apiKey)
    const rest = createRestClient(apiKey)

    // GraphQL path
    console.log('=== Bank Accounts (GraphQL) ===')
    const graphqlAccounts = await client.bankAccount.list()
    console.log(`Found ${graphqlAccounts.length} account(s)`)
    for (const acct of graphqlAccounts) {
        console.log(`  ${acct.id} — ${acct.name ?? '(unnamed)'} [${acct.type}]`)
    }

    // REST API path (HMAC-signed)
    console.log('\n=== Bank Accounts (REST API) ===')
    const restAccounts = await rest.restApi({
        method: 'get',
        path: '/v1/bank-accounts/',
    })
    console.log(JSON.stringify(restAccounts, null, 2))
}

main().catch((err) => {
    console.error('Failed:', err.message ?? err)
    process.exit(1)
})
