# ACH Onramp Integration Guide

ACH onramp lets your users convert USD from their bank account into USDC delivered to a Solana wallet. The user links a bank account via Plaid, then authorizes ACH debits that settle as USDC at a wallet address you supply.

```
Link Bank Account → Funding Source → Prepare Deposit → Create Deposit → USDC Released
      (Plaid)        (automatic)       (quote + auth)   (no signature)    (async)
```

Authorization is derived from the verified ACH funding source — no wallet signature is required.

## Prerequisites

- **Integration credentials** — integration key and HMAC secret (provided by Spritz)
- **User API key** — the authenticated user must have completed KYC
- **Plaid Link SDK** — for bank account linking ([React Native](https://plaid.com/docs/link/react-native/), [Web](https://plaid.com/docs/link/web/), [iOS](https://plaid.com/docs/link/ios/), [Android](https://plaid.com/docs/link/android/))
- **A Solana wallet address** for the user — Base58-encoded public key

### Architecture note

The Spritz SDK runs **server-side** (Node.js). It will throw if instantiated in a browser without `dangerouslyAllowBrowser: true`. In a typical integration:

- **Server** — SDK calls (create link token, list funding sources, prepare/create deposit)
- **Client** — Plaid Link UI

### SDK Setup

```typescript
import { SpritzApiClient, Environment } from '@spritz-finance/api-client'

const client = SpritzApiClient.initialize({
    environment: Environment.Production, // or Environment.Sandbox
    integrationKey: process.env.SPRITZ_INTEGRATION_KEY,
    integratorSecret: process.env.SPRITZ_INTEGRATOR_SECRET,
    apiKey: userApiKey, // from client.user.create() — see README for user creation
})
```

### KYC Verification

Users must be KYC-verified before they can link a bank account or create deposits. In production, use the Persona verification flow (see the main [README](../README.md#identity-verification)). In sandbox, bypass it programmatically:

```typescript
await client.sandbox.bypassKyc({ country: 'US' })
```

---

## Step 1: Link Bank Account

Bank accounts are linked through [Plaid Link](https://plaid.com/docs/link/). This is a two-part flow: create a link token server-side, then run the Plaid Link UI client-side.

### 1a. Create a link token

```typescript
const { linkToken, hostedLinkUrl } = await client.bankAccount.createLinkToken()
```

**Response:**

| Field           | Type             | Description                           |
| --------------- | ---------------- | ------------------------------------- |
| `linkToken`     | `string`         | Token for initializing Plaid Link SDK |
| `hostedLinkUrl` | `string \| null` | Plaid-hosted URL (alternative to SDK) |
| `expiration`    | `string`         | Token expiry (ISO 8601)               |

### 1b. Run Plaid Link

Use the `linkToken` with the Plaid Link SDK on your frontend. Plaid provides SDKs for [React Native](https://plaid.com/docs/link/react-native/), [Web](https://plaid.com/docs/link/web/), [iOS](https://plaid.com/docs/link/ios/), and [Android](https://plaid.com/docs/link/android/).

**React Native** (using [`react-native-plaid-link-sdk`](https://github.com/plaid/react-native-plaid-link-sdk) v11+):

```typescript
import { create, open, dismissLink } from 'react-native-plaid-link-sdk'

// Create the link handler with callbacks
create({
    token: linkToken,
    onSuccess: async (success) => {
        // Exchange the token on your server
        await yourServer.completePlaidLink({
            publicToken: success.publicToken,
            accountIds: success.metadata.accounts.map((a) => a.id),
            institutionId: success.metadata.institution?.id,
            institutionName: success.metadata.institution?.name,
        })
    },
    onExit: (exit) => {
        if (exit.error) console.error('Plaid error:', exit.error)
    },
})

// Open the Plaid Link UI
open()
```

On your server, call `completeLinking` with the values from the client:

```typescript
await client.bankAccount.completeLinking({
    publicToken,
    accountIds,
    institutionId,
    institutionName,
})
```

**Web** (using [`react-plaid-link`](https://github.com/plaid/react-plaid-link) or the vanilla JS SDK):

```typescript
const handler = Plaid.create({
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
        await client.bankAccount.completeLinking({
            publicToken,
            accountIds: metadata.accounts.map((a) => a.id),
            // Note: Web SDK uses institution_id, RN SDK uses id
            institutionId: metadata.institution?.institution_id,
            institutionName: metadata.institution?.name,
        })
    },
})
handler.open()
```

The `completeLinking` call exchanges the Plaid public token and stores the linked bank account. A **funding source** is created automatically from the linked account.

---

## Step 2: Get Funding Source

A funding source represents a linked bank account that has been evaluated for ACH eligibility. After Plaid linking, query for available sources:

```typescript
const sources = await client.fundingSource.list()
const source = sources.find((s) => s.status === 'active')

if (!source) {
    // No active funding source yet — may still be pending after Plaid linking
    throw new Error('No active funding source available')
}
```

**Funding source fields:**

| Field                  | Type             | Description                                  |
| ---------------------- | ---------------- | -------------------------------------------- |
| `id`                   | `string`         | Opaque identifier (e.g. `fs_01JV7...`)       |
| `bankAccountId`        | `string`         | Underlying bank account ID                   |
| `institutionName`      | `string \| null` | Bank name                                    |
| `accountNumberLast4`   | `string \| null` | Last 4 digits                                |
| `accountType`          | `string`         | `checking`, `savings`, `business`, `unknown` |
| `status`               | `string`         | See below                                    |
| `statusReason`         | `string \| null` | Why the source is not active                 |
| `ownershipMatchStatus` | `string \| null` | `matched`, `mismatch`, `review_required`     |

**Statuses:**

| Status            | Meaning                            |
| ----------------- | ---------------------------------- |
| `pending`         | Ownership verification in progress |
| `active`          | Ready for deposits                 |
| `review_required` | Manual review needed               |
| `ineligible`      | Cannot be used for ACH             |
| `disabled`        | Administratively disabled          |

Only `active` funding sources can be used for deposits. A source may remain `pending` briefly after Plaid linking while ownership is verified.

To fetch a specific source:

```typescript
const source = await client.fundingSource.get('fs_01JV7...')
```

---

## Step 3: Prepare Deposit

A deposit initiates an ACH debit from the user's bank account and releases USDC to a Solana wallet you specify. Preparation returns a quote and a display-ready ACH authorization message.

```typescript
const preparation = await client.deposit.prepare({
    sourceId: source.id,
    address: walletAddress, // user's Solana wallet, e.g. "9xQeWvG816bUx9EPjHmaT23yvVM..."
    network: 'solana',
    asset: 'USDC',
    quoteType: 'exact_input',
    amountUsd: '100.00',
    priority: 'normal',
})
```

**Request parameters:**

| Field        | Type      | Description                                   |
| ------------ | --------- | --------------------------------------------- |
| `sourceId`   | `string`  | Funding source ID                             |
| `address`    | `string`  | Destination Solana wallet (Base58 public key) |
| `network`    | `string`  | `solana`                                      |
| `asset`      | `string`  | `USDC`                                        |
| `quoteType`  | `string`  | `exact_input` or `exact_output`               |
| `amountUsd`  | `string`  | USD amount as decimal string                  |
| `priority`   | `string`  | `normal` or `high`                            |
| `feeSubsidy` | `object?` | Optional integrator fee subsidy               |

**Quote types:**

- **`exact_input`** — the user specifies how much USD to debit. USDC received = input minus fees.
- **`exact_output`** — the user specifies how much USDC to receive. USD debited = output plus fees.

**Priority:**

- **`normal`** — standard ACH processing timeline
- **`high`** — expedited processing (higher fee rate)

**Fee subsidy** — integrators can absorb part of the fee on behalf of the user:

```typescript
feeSubsidy: {
  percentage: 50,        // subsidize 50% of the fee
  maxAmountUsd: '5.00',  // cap subsidy at $5
}
```

**Preparation response:**

| Field                         | Type     | Description                                   |
| ----------------------------- | -------- | --------------------------------------------- |
| `preparationId`               | `string` | Needed for deposit creation                   |
| `message`                     | `string` | Display-ready ACH authorization message       |
| `expiresAt`                   | `string` | Submission deadline                           |
| `summary.requestedAmountUsd`  | `string` | What the user asked for                       |
| `summary.principalAmountUsd`  | `string` | USD used to buy USDC (total debit minus fees) |
| `summary.userFeeUsd`          | `string` | Fee charged to the user                       |
| `summary.totalDebitAmountUsd` | `string` | Total USD debited from bank                   |
| `summary.expectedAssetAmount` | `string` | USDC to be released                           |
| `summary.feeRateBps`          | `number` | Fee rate in basis points                      |
| `summary.destinationAddress`  | `string` | Wallet receiving USDC                         |

Display the summary and `message` to the user for review before proceeding.

---

## Step 4: Create Deposit

Once the user has reviewed the quote and authorization, submit the preparation ID to create the deposit. No signature is required — authorization is derived from the verified ACH funding source.

```typescript
const deposit = await client.deposit.create({
    preparationId: preparation.preparationId,
})
```

**Deposit response:**

| Field                 | Type     | Description              |
| --------------------- | -------- | ------------------------ |
| `id`                  | `string` | Deposit ID (`dep_...`)   |
| `status`              | `string` | Overall deposit status   |
| `debitStatus`         | `string` | ACH debit lifecycle      |
| `releaseStatus`       | `string` | Crypto release lifecycle |
| `totalDebitAmountUsd` | `string` | USD debited              |
| `expectedAssetAmount` | `string` | USDC to release          |
| `address`             | `string` | Destination wallet       |
| `authorizedAt`        | `string` | When the user authorized |

---

## Deposit Lifecycle

A deposit moves through two parallel lifecycles: the ACH debit and the crypto release.

### Overall status

```
authorized → processing → completed
                        → partially_released
                        → returned
                        → failed
```

| Status               | Description                                   |
| -------------------- | --------------------------------------------- |
| `authorized`         | User authorized, ACH debit not yet submitted  |
| `processing`         | ACH debit in flight, crypto release may begin |
| `completed`          | USDC fully released to wallet                 |
| `partially_released` | Partial USDC released, remainder pending      |
| `returned`           | ACH debit returned by bank                    |
| `failed`             | Deposit failed                                |

### Debit status

`authorized` → `submitting` → `submitted` → `settled` / `returned` / `failed`

### Release status

`not_started` → `queued` → `partial` / `completed` / `failed`

### Release decision modes

| Mode               | Description                                       |
| ------------------ | ------------------------------------------------- |
| `after_settlement` | USDC released only after ACH settles              |
| `early_full`       | Full USDC released before ACH settlement          |
| `early_partial`    | Partial early release, remainder after settlement |

### Return handling

If an ACH debit is returned by the bank, the deposit moves to `returned`. The `returnCode` and `returnReason` fields describe why (e.g. insufficient funds, account closed). Use webhooks to monitor for returns.

---

## ACH Debit Returns (Integrator)

Returns are also queryable via integrator-scoped endpoints, which surface every ACH return across all of your users along with loss accounting and the user/funding-source state at the time of the return.

### List returns

```typescript
const { data, hasMore, nextCursor } = await client.achDebitReturn.list({
    limit: 50,
    occurredAfter: '2026-01-01T00:00:00Z',
    returnBucket: 'unauthorized', // optional — 'unauthorized' | 'administrative' | 'other'
    lossOnly: 'true', // optional — only returns where Spritz/integrator absorbed loss
})

if (hasMore) {
    const next = await client.achDebitReturn.list({ cursor: nextCursor })
}
```

**Query parameters:**

| Field                 | Type                                                                          | Description                                                   |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `limit`               | `number`                                                                      | Page size                                                     |
| `cursor`              | `string`                                                                      | Cursor from a previous `nextCursor`                           |
| `userId` / `userIds`  | `string`                                                                      | Filter to a single user (or comma-separated list)             |
| `search`              | `string`                                                                      | Free-text search                                              |
| `returnCode`          | `string`                                                                      | Specific NACHA return code (e.g. `R01`)                       |
| `returnBucket`        | `'unauthorized' \| 'administrative' \| 'other'`                               | Reporting bucket                                              |
| `cryptoStateAtReturn` | `'not_released' \| 'in_flight' \| 'partially_confirmed' \| 'fully_confirmed'` | What stage the crypto release was in when the return hit      |
| `lossOnly`            | `'true' \| 'false'`                                                           | Only returns where USDC had already left (i.e. unrecoverable) |
| `userAction`          | `'none' \| 'review_required' \| 'disabled'`                                   | Filter by automated user action taken                         |
| `occurredAfter`       | `string`                                                                      | ISO 8601 lower bound                                          |
| `occurredBefore`      | `string`                                                                      | ISO 8601 upper bound                                          |

**Return fields:**

| Field                 | Type             | Description                                                         |
| --------------------- | ---------------- | ------------------------------------------------------------------- |
| `id`                  | `string`         | ACH return ID (`dr_...`)                                            |
| `depositId`           | `string`         | Originating deposit                                                 |
| `userId`              | `string`         | Spritz user ID                                                      |
| `sourceId`            | `string`         | Funding source the debit pulled from                                |
| `onRampId`            | `string \| null` | Linked on-ramp, if any                                              |
| `amountUsd`           | `string`         | Returned amount                                                     |
| `currency`            | `string`         | Always `USD` for ACH                                                |
| `returnCode`          | `string \| null` | NACHA return code                                                   |
| `returnReason`        | `string \| null` | Human-readable reason                                               |
| `occurredAt`          | `string`         | ISO 8601                                                            |
| `cryptoStateAtReturn` | `string`         | Crypto release state when the return arrived                        |
| `lossAmountUsd`       | `string`         | USDC already released and unrecoverable                             |
| `atRiskAmountUsd`     | `string`         | USDC in flight at return time                                       |
| `sourceAction`        | `string`         | Action taken on the funding source — `disabled`                     |
| `userAction`          | `string`         | Action taken on the user — `none`, `review_required`, or `disabled` |
| `reportingBucket`     | `string`         | `unauthorized`, `administrative`, or `other`                        |

### Get a single return

```typescript
const ret = await client.achDebitReturn.get('dr_01JV7...')
```

---

## Webhooks

Register a webhook to receive real-time notifications for deposit status changes. See the [webhook documentation](https://docs.spritz.finance/webhooks) for setup details.

Key events to handle:

- **Deposit status change** — debit submitted, settled, returned, failed
- **Release status change** — USDC queued, released, failed

---

## Error Handling

All endpoints return [RFC 7807](https://datatracker.ietf.org/doc/html/rfc7807) problem details on error:

```json
{
    "type": "urn:problem-type:validation:invalid-input",
    "title": "Invalid Input",
    "status": 400,
    "detail": "amountUsd must be a positive decimal string"
}
```

Common error scenarios:

| Scenario                     | Status  | Problem type                         |
| ---------------------------- | ------- | ------------------------------------ |
| Missing/invalid bearer token | 401     | `urn:problem-type:auth:unauthorized` |
| Feature not enabled          | 403     | `urn:problem-type:auth:forbidden`    |
| Funding source not found     | 404     | Resource not found                   |
| Preparation expired          | 400/409 | Expired preparation ID               |
| Funding source not active    | 400/409 | Source not eligible                  |

---

## Sandbox

Use `Environment.Sandbox` for testing. The sandbox base URL is `https://sandbox.spritz.finance`.

### Quick start

1. Create a user and bypass KYC:

    ```bash
    ./scripts/sandbox/run.sh setup-user
    ```

2. Open the interactive demo:
    ```bash
    open scripts/sandbox/ach-onramp.html
    ```
    Enter your credentials and walk through the full flow.

### Plaid sandbox credentials

When prompted by Plaid Link, use:

- **Username:** `user_good`
- **Password:** `pass_good`

Select any checking account to complete linking.

---

## API Reference

| Method | Endpoint                                      | SDK Method                                | Description             |
| ------ | --------------------------------------------- | ----------------------------------------- | ----------------------- |
| `POST` | `/v1/bank-accounts/link-token`                | `client.bankAccount.createLinkToken()`    | Create Plaid link token |
| `POST` | `/v1/bank-accounts/link-complete`             | `client.bankAccount.completeLinking(...)` | Complete Plaid linking  |
| `GET`  | `/v1/funding-sources/`                        | `client.fundingSource.list()`             | List funding sources    |
| `GET`  | `/v1/funding-sources/{id}`                    | `client.fundingSource.get(id)`            | Get funding source      |
| `POST` | `/v1/deposits/direct/prepare`                 | `client.deposit.prepare(...)`             | Prepare deposit quote   |
| `POST` | `/v1/deposits/direct`                         | `client.deposit.create(...)`              | Create deposit          |
| `GET`  | `/v1/integrator/ach-debit/returns`            | `client.achDebitReturn.list(...)`         | List ACH debit returns  |
| `GET`  | `/v1/integrator/ach-debit/returns/{returnId}` | `client.achDebitReturn.get(id)`           | Get a single return     |

All endpoints require a Bearer token (`apiKey`). Integrator requests are additionally signed with HMAC — the SDK handles this automatically when `integratorSecret` is provided.
