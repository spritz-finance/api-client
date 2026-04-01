/**
 * Get payment limits for a bank account via the service layer (REST under the hood).
 *
 * Usage:
 *   ./scripts/sandbox/run.sh get-payment-limits <accountId>
 *
 * Requires SPRITZ_API_KEY in .env
 */
import { createClient } from './client'
import { requireEnv } from './env'

async function main() {
    const accountId = process.argv[2]
    if (!accountId) {
        console.error('Usage: get-payment-limits <accountId>')
        console.error('Run list-bank-accounts first to get an account ID')
        process.exit(1)
    }

    requireEnv('SPRITZ_API_KEY')
    const client = createClient()

    console.log(`=== Payment Limits for ${accountId} ===`)
    const limits = await client.payment.getPaymentLimits(accountId)

    if (!limits) {
        console.log('No limits returned (account may not exist)')
        return
    }

    console.log(JSON.stringify(limits, null, 2))
}

main().catch((err) => {
    console.error('Failed:', err.message ?? err)
    process.exit(1)
})
