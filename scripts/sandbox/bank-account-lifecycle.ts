/**
 * Create a US bank account via REST API, verify it exists, then delete it.
 *
 * Usage:
 *   ./scripts/sandbox/run.sh bank-account-lifecycle
 *
 * Requires SPRITZ_API_KEY in .env (user must be KYC-verified)
 */
import { createClient, createRestClient } from './client'
import { requireEnv } from './env'

async function main() {
    const apiKey = requireEnv('SPRITZ_API_KEY')
    const client = createClient()
    const rest = createRestClient(apiKey)

    // Create via REST API (HMAC-signed POST with body)
    console.log('=== Creating US bank account (REST API) ===')
    const created = await rest.restApi<{ id: string }>({
        method: 'post',
        path: '/v1/bank-accounts/',
        body: {
            type: 'us',
            ownership: 'personal',
            routingNumber: '021000021',
            accountNumber: '123456789',
            accountSubtype: 'checking',
            label: 'SDK Test Account',
        },
    })
    console.log('Created:', created)
    const accountId = created.id

    // List via GraphQL to confirm it exists
    console.log('\n=== Verifying via GraphQL ===')
    const accounts = await client.bankAccount.list()
    const found = accounts.find((a) => a.id === accountId)
    console.log(found ? `Found: ${found.id} — ${found.name} [${found.type}]` : 'NOT FOUND')

    // List via REST API to confirm
    console.log('\n=== Verifying via REST API ===')
    const restAccounts = await rest.restApi<unknown[]>({
        method: 'get',
        path: '/v1/bank-accounts/',
    })
    console.log(`REST API returned ${(restAccounts as unknown[]).length} account(s)`)

    // Delete via REST API (HMAC-signed DELETE, no body)
    console.log(`\n=== Deleting ${accountId} (REST API) ===`)
    await rest.restApi({
        method: 'delete',
        path: `/v1/bank-accounts/${accountId}`,
    })
    console.log('Deleted')

    // Verify deletion
    console.log('\n=== Verifying deletion (GraphQL) ===')
    const afterDelete = await client.bankAccount.list()
    const stillExists = afterDelete.find((a) => a.id === accountId)
    console.log(stillExists ? 'STILL EXISTS (unexpected)' : 'Confirmed deleted')
}

main().catch((err) => {
    console.error('Failed:', err.message ?? err)
    process.exit(1)
})
