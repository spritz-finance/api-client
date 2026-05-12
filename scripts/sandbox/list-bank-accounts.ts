/**
 * List bank accounts via the SDK (REST API, HMAC-signed).
 *
 * Usage:
 *   ./scripts/sandbox/run.sh list-bank-accounts
 *
 * Requires SPRITZ_API_KEY in .env
 */
import { createClient } from './client'
import { requireEnv } from './env'

async function main() {
    const apiKey = requireEnv('SPRITZ_API_KEY')
    const client = createClient(apiKey)

    console.log('=== Bank Accounts ===')
    const accounts = await client.bankAccount.list()
    console.log(`Found ${accounts.length} account(s)`)
    for (const acct of accounts) {
        const funding = acct.fundingSourceId
            ? `funding=${acct.fundingSourceId}`
            : 'no funding source'
        console.log(`  ${acct.id} — ${acct.label ?? '(unlabeled)'} [${acct.type}] ${funding}`)
    }
}

main().catch((err) => {
    console.error('Failed:', err.message ?? err)
    process.exit(1)
})
