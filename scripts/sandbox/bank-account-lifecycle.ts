/**
 * Create a US bank account via the SDK, verify it exists, then delete it.
 *
 * Usage:
 *   ./scripts/sandbox/run.sh bank-account-lifecycle
 *
 * Requires SPRITZ_API_KEY in .env (user must be KYC-verified)
 */
import { createClient } from './client'
import { requireEnv } from './env'

async function main() {
    const apiKey = requireEnv('SPRITZ_API_KEY')
    const client = createClient(apiKey)

    console.log('=== Creating US bank account ===')
    const created = await client.bankAccount.create({
        type: 'us',
        ownership: 'personal',
        routingNumber: '021000021',
        accountNumber: '123456789',
        accountSubtype: 'checking',
        label: 'SDK Test Account',
    })
    console.log('Created:', created)
    const accountId = created.id

    console.log('\n=== Verifying via list ===')
    const accounts = await client.bankAccount.list()
    const found = accounts.find((a) => a.id === accountId)
    console.log(
        found ? `Found: ${found.id} — ${found.label ?? '(unlabeled)'} [${found.type}]` : 'NOT FOUND'
    )

    console.log(`\n=== Deleting ${accountId} ===`)
    const deleted = await client.bankAccount.delete(accountId)
    console.log('Deleted:', deleted)

    console.log('\n=== Verifying deletion ===')
    const afterDelete = await client.bankAccount.list()
    const stillExists = afterDelete.find((a) => a.id === accountId)
    console.log(stillExists ? 'STILL EXISTS (unexpected)' : 'Confirmed deleted')
}

main().catch((err) => {
    console.error('Failed:', err.message ?? err)
    process.exit(1)
})
