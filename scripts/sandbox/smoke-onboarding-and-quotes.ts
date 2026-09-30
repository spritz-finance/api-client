/**
 * Smoke test for the EU onboarding and off-ramp quote SDK methods against sandbox.
 *
 * Usage:
 *   ./scripts/sandbox/run.sh smoke-onboarding-and-quotes
 *   ./scripts/sandbox/run.sh smoke-onboarding-and-quotes --only=eu
 *   ./scripts/sandbox/run.sh smoke-onboarding-and-quotes --only=us
 *   ./scripts/sandbox/run.sh smoke-onboarding-and-quotes --agreement-id=<signed agreement id>
 *   ./scripts/sandbox/run.sh smoke-onboarding-and-quotes --wait-sepa=180   (seconds, default 120)
 *
 * Requires SPRITZ_INTEGRATION_KEY and SPRITZ_INTEGRATOR_SECRET in .env. Each run creates
 * fresh users, so SPRITZ_API_KEY is not needed.
 *
 * Flows:
 *   eu: user -> sandbox.bypassKyc (EU) -> compliance.getRequirements -> compliance.submit ->
 *       terms.accept -> bankAccount.create (IBAN) -> offRampQuote.create (EUR, amountMode
 *       'input') -> autoRampAccount.create/list/get/estimate -> sandbox.simulateAutoRampDeposit
 *       -> onrampPayment.get
 *   us: user -> sandbox.bypassKyc (US) -> sandbox.linkBankAccount -> offRampQuote.create/get/
 *       getTransaction
 *
 * Notes:
 * - Compliance is submitted before terms: the sandbox fails the Bridge customer creation
 *   when compliance comes after terms (SPR-10431).
 * - Terms are accepted headlessly with a random agreement id by default. Sandbox accepts any
 *   id, as the platform's off-ramp conformance suite relies on. Pass --agreement-id to use
 *   one captured from the provider's hosted page instead.
 * - Bridge activates SEPA asynchronously after terms. The EU flow polls `user.getMe()` every
 *   10s (up to --wait-sepa seconds) until crypto_to_fiat and fiat_to_crypto on
 *   sepa_credit_transfer are both active; before that, IBAN and auto-ramp calls return 403.
 * - EUR quotes use `amountMode: 'input'`: the default `output` is rejected because the EUR
 *   rate is only fixed at settlement.
 * - Users are created with `POST /v1/integrator/users` directly, so the script does not
 *   depend on which route `user.create()` takes.
 *
 * Required steps (exit code 1 if any fails): compliance.submit (complianceFieldsComplete),
 * terms.accept (termsAccepted), the US quote create, and, once the EU user's SEPA
 * capabilities are active, the IBAN account, EUR quote and auto-ramp account create. Every step's request and
 * response is written to qc/evidence/ (gitignored), with API keys redacted.
 */
import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { SpritzClient } from '../../src/lib/client'
import { Environment as SrcEnvironment } from '../../src/env'
import { createClient } from './client'
import { optionalEnv, requireEnv } from './env'

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const USDC_SOLANA = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const DEFAULT_EVM_DEST = '0x000000000000000000000000000000000000dEaD'

function parseArgs(args: string[]): Record<string, string> {
    const result: Record<string, string> = {}
    for (const arg of args) {
        const match = arg.match(/^--([\w-]+)=(.+)$/)
        if (match) {
            result[match[1]!] = match[2]!
        }
    }
    return result
}

const args = parseArgs(process.argv.slice(2))
const only = args.only
const waitSepaSeconds = Number(args['wait-sepa'] ?? 120)
const destination = optionalEnv('SPRITZ_DEST_ADDRESS')
const evmDest =
    destination && /^0x[0-9a-fA-F]{40}$/.test(destination) ? destination : DEFAULT_EVM_DEST

// ---------------------------------------------------------------- evidence

type Outcome = 'ok' | 'failed' | 'skipped'
type Result = { n: number; name: string; outcome: Outcome; required: boolean; note?: string }
type Evidence = {
    step: string
    outcome: Outcome
    request?: unknown
    response?: unknown
    error?: unknown
}

const results: Result[] = []
const evidence: Evidence[] = []
const SECRET_KEYS = /^(apiKey|integratorSecret|secret|authorization)$/i

function redact(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(redact)
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, v]) => [
                key,
                SECRET_KEYS.test(key) ? '[redacted]' : redact(v),
            ])
        )
    }
    return value
}

async function step<T>(
    name: string,
    request: unknown,
    fn: () => Promise<T>,
    options: { required?: boolean } = {}
): Promise<T | undefined> {
    const n = results.length + 1
    try {
        const response = await fn()
        evidence.push({ step: name, outcome: 'ok', request, response })
        results.push({ n, name, outcome: 'ok', required: !!options.required })
        console.log(`  ok      ${name}`)
        return response
    } catch (e) {
        const err = e as { status?: number; message?: string; problem?: { code?: string } }
        const note = `${err.status ?? ''} ${err.problem?.code ?? ''} ${err.message ?? ''}`.trim()
        evidence.push({
            step: name,
            outcome: 'failed',
            request,
            error: { status: err.status, message: err.message ?? String(e), problem: err.problem },
        })
        results.push({ n, name, outcome: 'failed', required: !!options.required, note })
        console.log(`  FAILED  ${name}: ${note}`)
        return undefined
    }
}

function skip(name: string, note: string, required = false) {
    evidence.push({ step: name, outcome: 'skipped' })
    results.push({ n: results.length + 1, name, outcome: 'skipped', required, note })
    console.log(`  skipped ${name}: ${note}`)
}

// ---------------------------------------------------------------- users

// Integrator-only client (HMAC, no user). The constructor type asks for apiKey, but the
// integrator routes do not use one.
const integrator = new SpritzClient({
    environment: SrcEnvironment.Sandbox,
    integrationKey: requireEnv('SPRITZ_INTEGRATION_KEY'),
    integratorSecret: requireEnv('SPRITZ_INTEGRATOR_SECRET'),
    apiKey: undefined as unknown as string,
})

async function newUser(label: string) {
    const email = `sandbox+smoke-${label}-${Date.now()}@spritz.finance`
    const created = (await step(`${label}: POST /v1/integrator/users`, { email }, () =>
        integrator.restApi({ method: 'post', path: '/v1/integrator/users', body: { email } })
    )) as { userId: string; apiKey: string } | undefined
    return created ? createClient(created.apiKey) : undefined
}

// ---------------------------------------------------------------- flows

async function euFlow() {
    console.log('\nEU user')
    const client = await newUser('eu')
    if (!client) return skip('eu flow', 'user creation failed', true)

    await step('eu: sandbox.bypassKyc', { country: 'EU' }, () =>
        client.sandbox.bypassKyc({ country: 'EU' })
    )
    await step('eu: compliance.getRequirements (before)', null, () =>
        client.compliance.getRequirements()
    )
    const compliance = {
        placeOfBirth: { country: 'DEU', city: 'Berlin' },
        nationalities: ['DEU'],
        accountPurpose: 'personal_or_living_expenses' as const,
    }
    await step(
        'eu: compliance.submit',
        compliance,
        async () => {
            const submitted = await client.compliance.submit(compliance)
            if (submitted.complianceFieldsComplete !== true) {
                throw new Error('compliance.submit did not report complianceFieldsComplete: true')
            }
            return submitted
        },
        { required: true }
    )
    await step('eu: compliance.getRequirements (after)', null, () =>
        client.compliance.getRequirements()
    )

    await step('eu: user.getMe (before terms)', null, () => client.user.getMe())
    const agreementId = args['agreement-id'] ?? randomUUID()
    await step(
        'eu: terms.accept',
        { agreementId },
        async () => {
            const accepted = await client.terms.accept({ agreementId })
            if (accepted.termsAccepted !== true) {
                throw new Error('terms.accept did not report termsAccepted: true')
            }
            return accepted
        },
        { required: true }
    )
    // Bridge activates SEPA asynchronously after terms: poll the user until both SEPA
    // capabilities are active before creating anything (or subscribe to
    // `capabilities.updated`). EUR steps only count as required once their capability is.
    type Capability = { product: string; method?: string; status: string }
    const sepaStatus = (capabilities: Capability[] | undefined, product: string) =>
        capabilities?.find((c) => c.product === product && c.method === 'sepa_credit_transfer')
            ?.status
    let capabilities: Capability[] | undefined
    await step(`eu: wait for SEPA capabilities active (<= ${waitSepaSeconds}s)`, null, async () => {
        const deadline = Date.now() + waitSepaSeconds * 1000
        const started = Date.now()
        for (;;) {
            const me = (await client.user.getMe()) as { capabilities?: Capability[] }
            capabilities = me.capabilities
            const payout = sepaStatus(capabilities, 'crypto_to_fiat')
            const onramp = sepaStatus(capabilities, 'fiat_to_crypto')
            if (payout === 'active' && onramp === 'active') {
                return {
                    crypto_to_fiat: payout,
                    fiat_to_crypto: onramp,
                    afterSeconds: Math.round((Date.now() - started) / 1000),
                }
            }
            if (Date.now() >= deadline) {
                throw new Error(
                    `SEPA still crypto_to_fiat=${payout} fiat_to_crypto=${onramp} after ${waitSepaSeconds}s`
                )
            }
            await new Promise((resolve) => setTimeout(resolve, 10_000))
        }
    })
    const sepaPayoutActive = sepaStatus(capabilities, 'crypto_to_fiat') === 'active'
    const sepaOnrampActive = sepaStatus(capabilities, 'fiat_to_crypto') === 'active'

    const ibanInput = {
        type: 'iban' as const,
        ownership: 'personal' as const,
        iban: 'DE89370400440532013000', // example from the API contract
        bic: 'COBADEFFXXX',
    }
    const iban = (await step(
        'eu: bankAccount.create (iban)',
        ibanInput,
        () => client.bankAccount.create(ibanInput),
        { required: sepaPayoutActive }
    )) as { id: string } | undefined
    if (iban) {
        const eurQuoteInput = {
            accountId: iban.id,
            amount: '10.00',
            amountMode: 'input' as const,
            chain: 'solana' as const,
            tokenAddress: USDC_SOLANA,
        }
        const eurQuote = (await step(
            'eu: offRampQuote.create (EUR)',
            eurQuoteInput,
            () => client.offRampQuote.create(eurQuoteInput),
            { required: sepaPayoutActive }
        )) as { id: string } | undefined
        if (eurQuote) {
            await step('eu: offRampQuote.get (EUR)', { quoteId: eurQuote.id }, () =>
                client.offRampQuote.get(eurQuote.id)
            )
        }
    } else {
        skip('eu: offRampQuote.create (EUR)', 'no IBAN account created', sepaPayoutActive)
    }

    const accountInput = { address: evmDest, network: 'base' as const, token: 'USDC' }
    const account = (await step(
        'eu: autoRampAccount.create',
        accountInput,
        () => client.autoRampAccount.create(accountInput),
        { required: sepaOnrampActive }
    )) as { id: string } | undefined
    await step('eu: autoRampAccount.list', null, () => client.autoRampAccount.list())
    if (!account) return skip('eu: auto-ramp follow-ups', 'no account created')
    await step('eu: autoRampAccount.get', { id: account.id }, () =>
        client.autoRampAccount.get(account.id)
    )
    await step('eu: autoRampAccount.estimate', { id: account.id, amount: '100.00' }, () =>
        client.autoRampAccount.estimate(account.id, '100.00')
    )
    const deposit = (await step(
        'eu: sandbox.simulateAutoRampDeposit',
        { id: account.id, amount: '100.00' },
        () => client.sandbox.simulateAutoRampDeposit(account.id, { amount: '100.00' })
    )) as { onRampId: string } | undefined
    if (deposit) {
        await step('eu: onrampPayment.get', { onRampId: deposit.onRampId }, () =>
            client.onrampPayment.get(deposit.onRampId)
        )
    }
}

async function usFlow() {
    console.log('\nUS user')
    const client = await newUser('us')
    if (!client) return skip('us flow', 'user creation failed', true)

    await step('us: sandbox.bypassKyc', { country: 'US' }, () =>
        client.sandbox.bypassKyc({ country: 'US' })
    )
    const link = (await step(
        'us: sandbox.linkBankAccount',
        { simulation: { code: 'ownership_matched' } },
        () => client.sandbox.linkBankAccount({ simulation: { code: 'ownership_matched' } })
    )) as { bankAccounts?: { id: string; status: string }[] } | undefined
    const bank = link?.bankAccounts?.find((a) => a.status === 'active') ?? link?.bankAccounts?.[0]
    if (!bank) return skip('us: offRampQuote.create', 'no bank account linked', true)

    const quoteInput = {
        accountId: bank.id,
        amount: '10.00',
        chain: 'base' as const,
        tokenAddress: USDC_BASE,
    }
    const quote = (await step(
        'us: offRampQuote.create',
        quoteInput,
        () => client.offRampQuote.create(quoteInput),
        { required: true }
    )) as { id: string; fulfillment: string } | undefined
    if (!quote) return
    await step('us: offRampQuote.get', { quoteId: quote.id }, () =>
        client.offRampQuote.get(quote.id)
    )
    if (quote.fulfillment === 'sign_transaction') {
        await step('us: offRampQuote.getTransaction', { quoteId: quote.id }, () =>
            client.offRampQuote.getTransaction(quote.id)
        )
    } else {
        skip('us: offRampQuote.getTransaction', `fulfillment is ${quote.fulfillment}`)
    }
    skip('us: offRampQuote.submit', 'not run: needs a real broadcast transaction hash')
}

// ---------------------------------------------------------------- main

async function main() {
    console.log('=== Onboarding and off-ramp quote smoke test (sandbox) ===')
    if (only !== 'us') await euFlow()
    if (only !== 'eu') await usFlow()

    const rows = results.map(
        (r) =>
            `| ${r.n} | ${r.name} | ${r.outcome}${r.required ? ' (required)' : ''} | ${r.note ?? ''} |`
    )
    console.log(['', '| # | Step | Outcome | Note |', '|---|---|---|---|', ...rows].join('\n'))

    const file = `qc/evidence/smoke-onboarding-and-quotes-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    mkdirSync('qc/evidence', { recursive: true })
    writeFileSync(file, JSON.stringify(redact({ results, evidence }), null, 2))
    console.log(`\nEvidence: ${file}`)

    const failed = results.filter((r) => r.required && r.outcome !== 'ok')
    process.exit(failed.length ? 1 : 0)
}

main().catch((err) => {
    console.error('Failed:', err.message ?? err)
    process.exit(1)
})
