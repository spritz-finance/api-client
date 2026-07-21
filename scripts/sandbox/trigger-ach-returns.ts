/**
 * Trigger every documented ACH debit return type in staging.
 *
 * For each NACHA code in the documented test set, prepares a direct deposit
 * and arms its ACH debit to return with that code via the sandbox endpoint.
 * Each deposit settles into the `returned` lifecycle and surfaces in
 * `client.achDebitReturn.list()`.
 *
 * Usage:
 *   ./scripts/sandbox/run.sh trigger-ach-returns
 *
 * Requires in .env (user must be KYC-verified with an active funding source):
 *   SPRITZ_API_KEY        - user-scoped API key
 *   SPRITZ_DEST_ADDRESS   - destination wallet address for the deposit
 * Optional:
 *   SPRITZ_DEST_NETWORK   - one of solana|ethereum|polygon|base|avalanche|arbitrum (default: solana)
 */
import { createClient } from './client'
import { requireEnv, optionalEnv } from './env'

// Documented test set from docs/ach-onramp-guide.md.
// R01/R02/R03 exercise the administrative-loss path; R10/R29 the
// unauthorized user-action path (review_required / disabled).
const RETURN_CODES = ['R01', 'R02', 'R03', 'R10', 'R29'] as const

type Network = 'solana' | 'ethereum' | 'polygon' | 'base' | 'avalanche' | 'arbitrum'

// 12.17 maps to Plaid Signal score 60 — expected allow under the staging
// threshold, so the deposit authorizes before the armed return fires.
const AMOUNT_USD = '12.17'

async function main() {
    const apiKey = requireEnv('SPRITZ_API_KEY')
    const address = requireEnv('SPRITZ_DEST_ADDRESS')
    const network = (optionalEnv('SPRITZ_DEST_NETWORK') ?? 'solana') as Network

    const client = createClient(apiKey)

    console.log('=== Selecting funding source ===')
    const sources = await client.fundingSource.list()
    const source = sources.find((s) => s.status === 'active') ?? sources[0]
    if (!source) {
        console.error(
            'No funding sources found for this user. Link and verify a bank account first.'
        )
        process.exit(1)
    }
    if (source.status !== 'active') {
        console.error(
            `Funding source ${source.id} is "${source.status}" (reason: ${source.statusReason ?? 'none'}), not active. ` +
                'Returns may not arm correctly until it is active.'
        )
    }
    console.log(`Using funding source ${source.id} [${source.accountType}, ${source.status}]`)
    console.log(`Destination: ${address} (${network})\n`)

    const results: Array<{ code: string; depositId?: string; status?: string; error?: string }> = []

    for (const code of RETURN_CODES) {
        console.log(`=== ${code} ===`)
        try {
            const preparation = await client.deposit.prepare({
                sourceId: source.id,
                address,
                network,
                asset: 'USDC',
                quoteType: 'exact_input',
                amountUsd: AMOUNT_USD,
                priority: 'normal',
            })

            const deposit = await client.sandbox.createDepositWithReturn({
                preparationId: preparation.preparationId,
                returnSimulation: { code },
            })

            console.log(`  deposit ${deposit.id} — status=${deposit.status}`)
            results.push({ code, depositId: deposit.id, status: deposit.status })
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            console.error(`  FAILED: ${message}`)
            results.push({ code, error: message })
        }
    }

    console.log('\n=== Summary ===')
    for (const r of results) {
        if (r.error) {
            console.log(`  ${r.code}: ERROR — ${r.error}`)
        } else {
            console.log(`  ${r.code}: ${r.depositId} (${r.status})`)
        }
    }

    const failed = results.filter((r) => r.error).length
    if (failed > 0) {
        console.log(`\n${failed}/${results.length} failed.`)
        process.exit(1)
    }
    console.log(
        `\nAll ${results.length} returns armed. Poll client.achDebitReturn.list() to confirm settlement into the returned lifecycle.`
    )
}

main().catch((err) => {
    console.error('Failed:', err.message ?? err)
    process.exit(1)
})
