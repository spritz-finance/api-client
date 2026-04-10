# ACH Onramp Integration Guide

ACH onramp lets your users convert USD from their bank account into USDC delivered to a Solana wallet. The user links a bank account via Plaid, binds a wallet address, then authorizes ACH debits that settle as USDC.

```
Link Bank Account → Funding Source → Bind Wallet → Authorize Deposit → USDC Released
      (Plaid)        (automatic)    (Ed25519 sig)   (Ed25519 sig)      (async)
```

## Prerequisites

- **Integration credentials** — integration key and HMAC secret (provided by Spritz)
- **User API key** — the authenticated user must have completed KYC
- **Plaid Link SDK** — for bank account linking ([React Native](https://plaid.com/docs/link/react-native/), [Web](https://plaid.com/docs/link/web/), [iOS](https://plaid.com/docs/link/ios/), [Android](https://plaid.com/docs/link/android/))
- **Ed25519 signing** — the user's Solana wallet must sign authorization messages

### KYC Verification

Users must be KYC-verified before they can link a bank account or create deposits. In production, use the Persona verification flow (see the main [README](../README.md#identity-verification)). In sandbox, bypass it programmatically:

```typescript
await client.sandbox.bypassKyc({ country: 'US' })
```

### SDK Setup

```typescript
import { SpritzApiClient, Environment } from '@spritz-finance/api-client'

const client = SpritzApiClient.initialize({
    environment: Environment.Production, // or Environment.Sandbox
    integrationKey: process.env.SPRITZ_INTEGRATION_KEY,
    integratorSecret: process.env.SPRITZ_INTEGRATOR_SECRET,
    apiKey: userApiKey,
})
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

**React Native** (using [`react-native-plaid-link-sdk`](https://github.com/plaid/react-native-plaid-link-sdk)):

```typescript
import { create, open } from 'react-native-plaid-link-sdk'

create({ token: linkToken })

open({
    onSuccess: async ({ publicToken, metadata }) => {
        await client.bankAccount.completeLinking({
            publicToken,
            accountIds: metadata.accounts.map((a) => a.id),
            institutionId: metadata.institution?.id,
            institutionName: metadata.institution?.name,
        })
    },
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

## Step 3: Bind Deposit Destination

Before creating deposits, the user must bind a Solana wallet address to a funding source. This proves wallet ownership via an Ed25519 signature and establishes where USDC will be delivered.

### 3a. Prepare the bind

```typescript
const preparation = await client.depositDestination.prepareBind({
    sourceId: source.id,
    network: 'solana',
    asset: 'USDC',
    address: walletAddress,
})
```

**Response:**

| Field               | Type     | Description                                   |
| ------------------- | -------- | --------------------------------------------- |
| `preparationId`     | `string` | Opaque ID — needed for confirmation           |
| `message`           | `string` | Canonical message the wallet must sign        |
| `expiresAt`         | `string` | Signature must be submitted before this time  |
| `assetAddress`      | `string` | USDC mint address on Solana                   |
| `normalizedAddress` | `string` | Normalized wallet address used in the message |

### 3b. Sign the message

The user signs `preparation.message` with their Solana wallet. The signature must be Ed25519 over the exact UTF-8 bytes.

```typescript
// Using @solana/wallet-adapter-react:
const messageBytes = new TextEncoder().encode(preparation.message)
const signatureBytes = await wallet.signMessage(messageBytes)
const signature = bs58.encode(signatureBytes)
```

Both Base58 and Base64 encoded signatures are accepted. Base58 is conventional for Solana.

### 3c. Confirm the bind

```typescript
const destination = await client.depositDestination.confirmBind({
    preparationId: preparation.preparationId,
    signature,
    signerAddress: walletAddress,
})
```

**Response:**

| Field      | Type       | Description                       |
| ---------- | ---------- | --------------------------------- |
| `id`       | `string`   | Deposit destination ID (`dd_...`) |
| `sourceId` | `string`   | Funding source it's bound to      |
| `network`  | `"solana"` |                                   |
| `asset`    | `"USDC"`   |                                   |
| `address`  | `string`   | Bound wallet address              |
| `status`   | `string`   | `active` or `revoked`             |

A deposit destination is persistent. You only need to bind once per wallet + funding source pair. To list existing bindings:

```typescript
const destinations = await client.depositDestination.list()
```

---

## Step 4: Create Deposit

A deposit initiates an ACH debit from the user's bank account and releases USDC to their wallet. This also requires an Ed25519 signature authorizing the specific amount.

### 4a. Prepare the deposit

```typescript
const preparation = await client.deposit.prepare({
    sourceId: source.id,
    destinationId: destination.id,
    quoteType: 'exact_input',
    amountUsd: '100.00',
    priority: 'normal',
})
```

**Request parameters:**

| Field           | Type      | Description                     |
| --------------- | --------- | ------------------------------- |
| `sourceId`      | `string`  | Funding source ID               |
| `destinationId` | `string`  | Deposit destination ID          |
| `quoteType`     | `string`  | `exact_input` or `exact_output` |
| `amountUsd`     | `string`  | USD amount as decimal string    |
| `priority`      | `string`  | `normal` or `high`              |
| `feeSubsidy`    | `object?` | Optional integrator fee subsidy |

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
| `message`                     | `string` | ACH authorization message to sign             |
| `expiresAt`                   | `string` | Submission deadline                           |
| `summary.requestedAmountUsd`  | `string` | What the user asked for                       |
| `summary.principalAmountUsd`  | `string` | USD used to buy USDC (total debit minus fees) |
| `summary.userFeeUsd`          | `string` | Fee charged to the user                       |
| `summary.totalDebitAmountUsd` | `string` | Total USD debited from bank                   |
| `summary.expectedAssetAmount` | `string` | USDC to be released                           |
| `summary.feeRateBps`          | `number` | Fee rate in basis points                      |
| `summary.destinationAddress`  | `string` | Wallet receiving USDC                         |

Display the summary to the user for confirmation before signing.

### 4b. Sign the authorization

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
| `authorized`         | User signed, ACH debit not yet submitted      |
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

| Scenario                      | Status  | Problem type                         |
| ----------------------------- | ------- | ------------------------------------ |
| Missing/invalid bearer token  | 401     | `urn:problem-type:auth:unauthorized` |
| Feature not enabled           | 403     | `urn:problem-type:auth:forbidden`    |
| Funding source not found      | 404     | Resource not found                   |
| Preparation expired           | 400/409 | Expired preparation ID               |
| Signature verification failed | 400     | Invalid signature                    |
| Funding source not active     | 400/409 | Source not eligible                  |

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
    Enter your credentials and walk through the full flow. The demo generates an ephemeral Solana keypair and handles all signing in-browser.

### Plaid sandbox credentials

When prompted by Plaid Link, use:

- **Username:** `user_good`
- **Password:** `pass_good`

Select any checking account to complete linking.

---

## API Reference

| Method | Endpoint                           | SDK Method                                   | Description             |
| ------ | ---------------------------------- | -------------------------------------------- | ----------------------- |
| `POST` | `/v1/bank-accounts/link-token`     | `client.bankAccount.createLinkToken()`       | Create Plaid link token |
| `POST` | `/v1/bank-accounts/link-complete`  | `client.bankAccount.completeLinking(...)`    | Complete Plaid linking  |
| `GET`  | `/v1/funding-sources/`             | `client.fundingSource.list()`                | List funding sources    |
| `GET`  | `/v1/funding-sources/{id}`         | `client.fundingSource.get(id)`               | Get funding source      |
| `POST` | `/v1/deposit-destinations/prepare` | `client.depositDestination.prepareBind(...)` | Prepare wallet bind     |
| `POST` | `/v1/deposit-destinations/`        | `client.depositDestination.confirmBind(...)` | Confirm wallet bind     |
| `GET`  | `/v1/deposit-destinations/`        | `client.depositDestination.list()`           | List bound destinations |
| `POST` | `/v1/deposits/prepare`             | `client.deposit.prepare(...)`                | Prepare deposit quote   |
| `POST` | `/v1/deposits/`                    | `client.deposit.create(...)`                 | Create deposit          |

All endpoints require a Bearer token (`apiKey`). Integrator requests are additionally signed with HMAC — the SDK handles this automatically when `integratorSecret` is provided.
