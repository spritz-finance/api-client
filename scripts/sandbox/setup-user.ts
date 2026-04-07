/**
 * Create a sandbox user, bypass KYC, and print the API key.
 *
 * Usage:
 *   ./scripts/sandbox/run.sh setup-user [email]
 *
 * If no email is provided, generates one using a timestamp.
 */
import { createClient, createRestClient } from './client'

const email = process.argv[2] ?? `sandbox+${Date.now()}@spritz.finance`

async function main() {
    console.log(`Creating user: ${email}`)

    const client = createClient()
    const user = await client.user.create({ email })
    console.log(`User created: ${user.userId}`)
    console.log(`API key: ${user.apiKey}`)

    // Bypass KYC via REST API (HMAC-signed)
    console.log('\nBypassing KYC...')
    const rest = createRestClient(user.apiKey)
    await rest.restApi({
        method: 'post',
        path: '/v1/sandbox/bypass-kyc',
        body: { country: 'US' },
    })
    console.log('KYC bypassed (US)')

    // Verify by fetching user profile
    client.setApiKey(user.apiKey)
    const currentUser = await client.user.getCurrentUser()
    console.log('\nUser profile:')
    console.log(JSON.stringify(currentUser, null, 2))

    console.log(`\nAdd to .env:\n  SPRITZ_API_KEY=${user.apiKey}`)
}

main().catch((err) => {
    console.error('Failed:', err.message ?? err)
    process.exit(1)
})
