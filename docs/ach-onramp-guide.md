# ACH Onramp Integration Guide

Convert fiat (USD) from a user's bank account into crypto (USDC) delivered to a Solana wallet.

## Flow Overview

```
Link Bank Account (Plaid) → Get Funding Source → Bind Wallet → Create Deposit
```

1. **Link Bank Account** — User connects their bank via Plaid
2. **Funding Source** — A funding source is created automatically from the linked account
3. **Bind Deposit Destination** — User signs a message proving wallet ownership
4. **Create Deposit** — User authorizes an ACH debit; USDC is released to their wallet

## Prerequisites

- Spritz SDK installed (`@spritz-finance/api-client`)
- Integration key + secret (provided by Spritz)
- User must be KYC-verified before linking a bank account

```typescript
import { SpritzApiClient, Environment } from '@spritz-finance/api-client'

const client = SpritzApiClient.initialize({
    environment: Environment.Production,
    integrationKey: 'int_...',
    integratorSecret: 'secret_...',
    apiKey: userApiKey,
})
```

## Step 1: Link Bank Account

Create a Plaid Link token, then have the user complete the Plaid flow.

```typescript
// Get a Plaid link token
const { linkToken, hostedLinkUrl } = await client.bankAccount.createLinkToken()

// Option A: Use the Plaid Link SDK with `linkToken`
// Option B: Open `hostedLinkUrl` in a browser/webview

// After the user completes Plaid Link, exchange the public token:
await client.bankAccount.completeLinking({
    publicToken: '<public_token_from_plaid>',
    accountIds: ['<selected_account_id>'],
    institutionId: '<institution_id>', // optional
    institutionName: '<institution_name>', // optional
})
```

## Step 2: Get Funding Source

After linking, a funding source is created automatically. Retrieve it:

```typescript
const fundingSources = await client.fundingSource.list()
const activeSource = fundingSources.find((s) => s.status === 'active')

// Funding source fields:
// - id: opaque identifier (e.g. "fs_01JV7...")
// - bankAccountId: underlying bank account
// - status: "pending" | "active" | "review_required" | "ineligible" | "disabled"
// - institutionName, accountNumberLast4, accountType
```

A funding source may start as `"pending"` while ownership verification completes. Only `"active"` sources can be used for deposits.

## Step 3: Bind Deposit Destination

Before creating deposits, the user must bind a wallet address to a funding source. This requires an Ed25519 signature proving wallet ownership.

### 3a. Prepare the bind

```typescript
const preparation = await client.depositDestination.prepareBind({
    sourceId: activeSource.id,
    network: 'solana',
    asset: 'USDC',
    address: userWalletAddress,
})

// preparation.message — the canonical message to sign
// preparation.preparationId — needed for confirmation
// preparation.expiresAt — signature must be submitted before this time
```

### 3b. Sign the message

Have the user sign `preparation.message` with their Solana wallet. The signature must be Ed25519 over the exact UTF-8 bytes of the message.

```typescript
// Example with @solana/wallet-adapter:
const messageBytes = new TextEncoder().encode(preparation.message)
const signatureBytes = await wallet.signMessage(messageBytes)
const signature = bs58.encode(signatureBytes)
```

### 3c. Confirm the bind

```typescript
const destination = await client.depositDestination.confirmBind({
    preparationId: preparation.preparationId,
    signature,
    signerAddress: userWalletAddress,
})

// destination.id — deposit destination identifier
// destination.status — "active"
```

The deposit destination persists across sessions. You only need to bind once per wallet + funding source pair.

## Step 4: Create Deposit

### 4a. Prepare the deposit

```typescript
const preparation = await client.deposit.prepare({
    sourceId: activeSource.id,
    destinationId: destination.id,
    quoteType: 'exact_input', // or 'exact_output'
    amountUsd: '100.00',
    priority: 'normal', // or 'high'
})

// preparation.message — ACH authorization message to sign
// preparation.summary — fee breakdown:
//   .requestedAmountUsd, .principalAmountUsd, .userFeeUsd
//   .totalDebitAmountUsd, .expectedAssetAmount, .feeRateBps
```

**Quote types:**

- `exact_input` — User specifies the USD amount to debit. Crypto received = input minus fees.
- `exact_output` — User specifies the USDC amount to receive. USD debited = output plus fees.

**Priority:**

- `normal` — Standard ACH processing
- `high` — Expedited processing (higher fees)

**Fee subsidy** (optional) — integrators can subsidize fees:

```typescript
feeSubsidy: {
    percentage: 50,          // subsidize 50% of the fee
    maxAmountUsd: '5.00',   // cap subsidy at $5
}
```

### 4b. Sign the authorization

The user must sign the authorization message to approve the ACH debit:

```typescript
const messageBytes = new TextEncoder().encode(preparation.message)
const signatureBytes = await wallet.signMessage(messageBytes)
const signature = bs58.encode(signatureBytes)
```

### 4c. Create the deposit

```typescript
const deposit = await client.deposit.create({
    preparationId: preparation.preparationId,
    signature,
})

// deposit.id — deposit identifier
// deposit.status — "authorized" initially
// deposit.totalDebitAmountUsd — actual USD to be debited
// deposit.expectedAssetAmount — USDC to be released
// deposit.address — destination wallet
```

### Deposit lifecycle

```
authorized → processing → completed
                       ↘ partially_released
                       ↘ returned
                       ↘ failed
```

- `authorized` — Deposit created, ACH debit not yet initiated
- `processing` — ACH debit in progress
- `completed` — USDC fully released to wallet
- `partially_released` — Partial crypto release (remainder pending)
- `returned` — ACH debit returned by bank
- `failed` — Deposit failed

## Sandbox Testing

Use `Environment.Sandbox` and the sandbox base URL (`https://sandbox.spritz.finance`).

1. Create a test user: `./scripts/sandbox/run.sh setup-user`
2. Run the full flow: `./scripts/sandbox/run.sh ach-onramp`

The sandbox script generates an ephemeral Solana wallet and signs messages automatically, demonstrating the complete flow without a real wallet.

Plaid sandbox uses test credentials — when prompted, use:

- Username: `user_good`
- Password: `pass_good`

## API Reference

| Method | Endpoint                           | Description             |
| ------ | ---------------------------------- | ----------------------- |
| POST   | `/v1/bank-accounts/link-token`     | Create Plaid Link token |
| POST   | `/v1/bank-accounts/link-complete`  | Complete Plaid linking  |
| GET    | `/v1/funding-sources/`             | List funding sources    |
| GET    | `/v1/funding-sources/{id}`         | Get funding source      |
| POST   | `/v1/deposit-destinations/prepare` | Prepare wallet bind     |
| POST   | `/v1/deposit-destinations/`        | Confirm wallet bind     |
| GET    | `/v1/deposit-destinations/`        | List bound destinations |
| POST   | `/v1/deposits/prepare`             | Prepare deposit quote   |
| POST   | `/v1/deposits/`                    | Create deposit          |

All endpoints require Bearer token authentication (API key). Integrator requests are additionally signed with HMAC.
