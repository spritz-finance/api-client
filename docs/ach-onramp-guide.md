# ACH Onramp Integration Guide

ACH onramp lets your users convert USD from their bank account into USDC delivered to a Solana wallet. The integration is intentionally small: link a bank account with Plaid, choose an active funding source, check its limits, prepare a quote, show the ACH authorization text, then create the deposit.

Authorization is derived from the verified ACH funding source — no wallet signature is required.

```
Plaid Link → Funding Source → Limits → Prepare Quote → User Confirms → Create Deposit → ACH Pull
 (client)      (server)       (server)      (server)        (client)          (server)       (async)
```

> **The SDK is server-side only.** It throws if instantiated in a browser without `dangerouslyAllowBrowser: true`. The integrator key and HMAC secret must never reach the client. The split is:
>
> - **Server** — every SDK call in this guide (link token, funding sources, prepare/create deposit, returns)
> - **Client** — Plaid Link UI only

## Minimal Server Flow

Once your frontend has completed Plaid Link, the ACH flow is:

```typescript
const { bankAccounts } = await client.bankAccount.completeLinking({
    publicToken,
    accountIds,
    institutionId,
    institutionName,
})

// A bank account is the canonical record. Its `fundingSourceId`, if present,
// is what makes it usable for ACH onramp.
const onrampable = bankAccounts.find((b) => b.fundingSourceId)
if (!onrampable?.fundingSourceId) throw new Error('Linked account is not ACH-onramp eligible')

const source = await client.fundingSource.get(onrampable.fundingSourceId)
if (source.status !== 'active') throw new Error('Funding source is not active yet')

const limits = await client.fundingSource.getDepositLimits(source.id)

const preparation = await client.deposit.prepare({
    sourceId: source.id,
    address: walletAddress,
    network: 'solana',
    asset: 'USDC',
    quoteType: 'exact_input',
    amountUsd: '100.00',
    priority: 'normal',
})

// Show preparation.summary and preparation.message to the user first.
// The ACH pull is not started until create passes risk checks.
const deposit = await client.deposit.create({
    preparationId: preparation.preparationId,
})
```

Use `limits` to keep your UI inside the user's current ACH capacity before preparing a quote. Use webhooks to track the deposit after creation; `onrampPayment` and `achDebitReturn` are the read APIs for reconciliation.

## Prerequisites

- **Integration credentials** — integration key and HMAC secret (provided by Spritz)
- **User API key** — the authenticated user must have completed KYC
- **Plaid Link SDK** — for bank account linking ([React Native](https://plaid.com/docs/link/react-native/), [Web](https://plaid.com/docs/link/web/), [iOS](https://plaid.com/docs/link/ios/), [Android](https://plaid.com/docs/link/android/))
- **A Solana wallet address** for the user — Base58-encoded public key

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
        await yourServer.completePlaidLink({
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

### 1c. Handle OAuth redirects

For some institutions, Plaid Link sends the user out to their bank's OAuth page and the bank redirects back when auth completes. Spritz creates the Plaid link token, so the redirect targets must be registered on Spritz's Plaid account.

**Send the following to Spritz for allowlisting before going live:**

| Platform | What to send                                                          |
| -------- | --------------------------------------------------------------------- |
| Web      | An HTTPS redirect URL on a domain you control (e.g. `https://app.yourdomain.com/plaid-oauth`) |
| iOS      | The universal link URL you'll receive the redirect on (e.g. `https://app.yourdomain.com/plaid-oauth/`) — custom URL schemes (`yourapp://`) are not accepted |
| Android  | Your app's `applicationId` / package name (e.g. `com.yourdomain.app`) |

The work each platform has to do to actually handle the redirect differs:

#### Web

The flow has to be actively resumed by your app:

1. Persist the `linkToken` before opening Plaid Link (Plaid recommends `localStorage`).
2. The bank redirects back to your registered URL with `?oauth_state_id=...`.
3. On that landing page, re-initialize Plaid Link with the **same token** plus `receivedRedirectUri: window.location.href`. The SDK reads the OAuth state out of the URL and finishes the handoff.
4. After `onSuccess`, route the user back to wherever they started.

This matters especially on mobile web and in-app webviews (Gmail, Instagram, etc.), where the original tab can't be restored.

#### iOS (native)

The Plaid iOS SDK is still in memory while the user is in the bank's app/Safari, so the redirect just needs to be forwarded back into it:

1. Host an Apple App Site Association file at `https://yourdomain.com/.well-known/apple-app-site-association` (HTTPS, valid cert, no redirects) listing your team-ID-prefixed bundle ID and a path pattern matching the redirect URL.
2. Enable the **Associated Domains** capability in Xcode with `applinks:yourdomain.com`.
3. In `application(_:continue:restorationHandler:)`, forward the universal link URL into the Plaid SDK's continuation API.

No "received redirect URI" dance, no token persistence, no resume page — the SDK finishes the flow itself.

#### Android (native)

For most banks, you don't pass a `redirect_uri` at all. Plaid auto-generates one that bounces back into your app via Android's intent system using the registered package name.

Only if you need to link USAA, Chase, or a handful of other institutions that require true Android App Links:

1. Host `https://yourdomain.com/.well-known/assetlinks.json` with your app's SHA-256 cert fingerprints.
2. Add an `<intent-filter>` with `android:autoVerify="true"` for the redirect URL.

Otherwise, registering the package name with Spritz is the only step.

### Bank accounts vs. funding sources

A linked bank account can be used for **off-ramp** (paying out to USD) on its own. Using it for **on-ramp** (pulling USD via ACH debit) additionally requires a `fundingSource`, which represents the ACH eligibility check on top of the bank account.

The model is intentionally one-way:

- **Bank account** — the canonical record. Always usable for off-ramp.
- **Funding source** — exists only for ACH-onramp-eligible accounts. Linked to a bank account via `fundingSourceId`.

In practice, treat `client.bankAccount.list()` as the source of truth and use `bankAccount.fundingSourceId` as the signal that an account can be on-ramped from. A `null` `fundingSourceId` means off-ramp only.

---

## Step 2: Get Funding Source And Limits

After Plaid linking, find the bank account you want to debit and use its `fundingSourceId` to load the ACH funding source and limits:

```typescript
const accounts = await client.bankAccount.list()
const account = accounts.find((a) => a.fundingSourceId) // pick the ACH-eligible account

if (!account?.fundingSourceId) {
    throw new Error('No ACH-onramp-eligible bank account available')
}

const source = await client.fundingSource.get(account.fundingSourceId)
if (source.status !== 'active') {
    // May still be pending shortly after Plaid linking while ownership verifies
    throw new Error('Funding source is not active yet')
}
```

`client.fundingSource.list()` is still available if you want to iterate funding sources directly, but the recommended path is bank-account-first.

**Bank account fields relevant to on-ramp:**

| Field             | Type             | Description                                                                   |
| ----------------- | ---------------- | ----------------------------------------------------------------------------- |
| `id`              | `string`         | Bank account ID (`ba_...`). Use this for off-ramp.                            |
| `fundingSourceId` | `string \| null` | If present, the account is ACH-onramp-eligible. `null` means off-ramp only.   |
| `status`          | `string`         | `active`, `pending`, `inactive`, `rejected`.                                  |
| `type`            | `string`         | Region — `us`, `ca`, `uk`, `iban`. Only `us` accounts are ACH-debit eligible. |
| `supportedRails`  | `string[]`       | Payment rails enabled on the account (e.g. `ach_standard`, `rtp`, `wire`).    |
| `institution`     | `object?`        | Bank name and logo.                                                           |
| `label`           | `string?`        | Friendly name supplied at link/create time.                                   |

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

Before showing deposit amounts to the user, fetch the source's current ACH debit limits:

```typescript
const limits = await client.fundingSource.getDepositLimits(source.id)

if (Number(limits.dailyRemainingUsd) <= 0) {
    throw new Error('No remaining ACH deposit capacity today')
}
```

**Deposit limit fields:**

| Field                       | Type     | Description                                            |
| --------------------------- | -------- | ------------------------------------------------------ |
| `minimumDepositAmountUsd`   | `string` | Minimum deposit principal amount before fees           |
| `transactionLimitUsd`       | `string` | Maximum ACH debit amount per deposit                   |
| `dailyLimitUsd`             | `string` | Maximum daily ACH debit volume                         |
| `dailyRemainingUsd`         | `string` | Remaining daily ACH debit volume                       |
| `monthlyLimitUsd`           | `string` | Maximum monthly ACH debit volume                       |
| `monthlyRemainingUsd`       | `string` | Remaining monthly ACH debit volume                     |
| `unsettledDepositLimit`     | `number` | Maximum number of unsettled ACH debit deposits allowed |
| `unsettledDepositRemaining` | `number` | Remaining unsettled deposit capacity                   |

Limits are a pre-check for user experience. The API still validates limits and funding-source state again when you prepare and create the deposit.

---

## Step 3: Prepare Deposit

Preparation creates a quote and a display-ready ACH authorization message. It does not start the ACH pull. The pull is only initiated after the user confirms and `client.deposit.create(...)` passes risk checks.

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

Display `summary` and `message` to the user for review before proceeding. The user-facing confirm button should call your server, and your server should then call `client.deposit.create(...)`.

> **Compliance — display the authorization message verbatim.** `preparation.message` is the NACHA consent text that authorizes the ACH debit. It must be shown to the user as-is, unmodified, before they confirm. Paraphrasing, truncating, or styling away parts of the message is a NACHA compliance violation and will invalidate the authorization. Wrap it in a `<pre>` or equivalent so whitespace and line breaks are preserved.

---

## Step 4: Create Deposit

Once the user has reviewed the quote and authorization, submit the preparation ID to create the deposit. No signature is required — authorization is derived from the verified ACH funding source.

When you call `create`, Spritz runs Plaid Signal/risk checks after the user has confirmed but before the ACH pull is initiated. If the risk result blocks the transaction, the API returns 409 and no ACH debit is pulled.

Blocked create attempts consume the `preparationId`. After a blocked or expired attempt, prepare a new quote instead of retrying the same preparation.

```typescript
const deposit = await client.deposit.create({
    preparationId: preparation.preparationId,
})
```

**Deposit response (selected fields):**

| Field                 | Type             | Description                                        |
| --------------------- | ---------------- | -------------------------------------------------- |
| `id`                  | `string`         | Deposit ID (`dep_...`)                             |
| `status`              | `string`         | Overall deposit status                             |
| `debitStatus`         | `string`         | ACH debit lifecycle                                |
| `releaseStatus`       | `string`         | Crypto release lifecycle                           |
| `releaseDecisionMode` | `string`         | `after_settlement`, `early_full`, `early_partial`  |
| `totalDebitAmountUsd` | `string`         | USD debited                                        |
| `expectedAssetAmount` | `string`         | USDC to release                                    |
| `releasedAmountUsd`   | `string`         | USDC released so far (USD-denominated)             |
| `address`             | `string`         | Destination wallet                                 |
| `authorizedAt`        | `string`         | ISO 8601 — when the user authorized                |
| `settledAt`           | `string \| null` | ISO 8601 — when the ACH debit settled              |
| `returnedAt`          | `string \| null` | ISO 8601 — when the ACH debit was returned, if any |
| `completedAt`         | `string \| null` | ISO 8601 — when USDC release fully completed       |
| `returnCode`          | `string \| null` | NACHA return code, populated when `returned`       |
| `returnReason`        | `string \| null` | Human-readable return reason                       |
| `payoutTxHash`        | `string \| null` | Solana tx hash of the USDC release                 |

---

## Step 5: Track Deposit Status

Once a deposit is authorized, an **on-ramp record** is created and is the canonical place to observe its state going forward. Listing or fetching the deposit by ID directly is not exposed. The on-ramp model unifies all fiat→crypto transactions (ACH, wire, SEPA), so the same APIs work for any rail.

```typescript
// List the user's recent on-ramps (newest first by default)
const { data, hasMore, nextCursor } = await client.onrampPayment.list({
    network: 'solana',
    token: 'USDC',
    limit: 20,
})

// Fetch a single on-ramp by ID
const onRamp = await client.onrampPayment.get('onramp_xyz789')
```

**Selected on-ramp fields:**

| Field                               | Type                | Description                                                                                                                      |
| ----------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | `string`            | On-ramp ID (`onramp_...`)                                                                                                        |
| `status`                            | `string`            | `awaiting_payment`, `processing`, `partially_delivered`, `completed`, `failed`, `cancelled`, `reversed`, `refunded`, `in_review` |
| `createdAt`                         | `string`            | ISO 8601                                                                                                                         |
| `input.amount` / `input.currency`   | `string` / `string` | Fiat sent (after fees) and currency                                                                                              |
| `input.rail`                        | `string`            | `ach_credit`, `wire`, `sepa_credit_transfer` — for ACH onramp this is `ach_credit`                                               |
| `output.amount` / `output.token`    | `string` / `string` | Crypto amount and token to be delivered                                                                                          |
| `output.network` / `output.address` | `string` / `string` | Destination network and wallet                                                                                                   |
| `deliverySummary`                   | `object?`           | `deliveredAmount`, `confirmedAmount`, `remainingAmount` — useful for partial-release deposits                                    |
| `deliveries`                        | `object[]?`         | Per-tranche delivery records with `status`, `amount`, `txHash`, timestamps                                                       |
| `completedAt`                       | `string?`           | ISO 8601 when fully delivered                                                                                                    |

The on-ramp ID is also surfaced on ACH return records (`achDebitReturn.onRampId`), so you can pivot from a return to the originating on-ramp/deposit.

> **In production, prefer webhooks over polling** — register for on-ramp status events so you only fetch when state actually changes. See [Webhooks](#webhooks) below.

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

Register a webhook before launching ACH debit so your backend is notified when deposit state changes. Polling `onrampPayment` and `achDebitReturn` is useful for reconciliation, but webhooks should drive production updates.

```typescript
await client.webhook.updateWebhookSecret(process.env.SPRITZ_WEBHOOK_SECRET!)

const webhook = await client.webhook.create({
    url: 'https://api.example.com/spritz/webhooks',
    events: ['onramp.created', 'onramp.updated', 'achDebitReturn.created'],
})
```

Key events to handle:

- `onramp.created` — on-ramp record created after the ACH deposit is authorized
- `onramp.updated` — on-ramp status, delivery, or reversal details updated
- `onramp.completed` — on-ramp delivery completed
- `achDebitReturn.created` — ACH debit return recorded
- `achDebitReturn.updated` — ACH debit return details updated

To subscribe an endpoint to every current and future event, use `events: ['*']`.
To change an existing webhook's event subscriptions:

```typescript
await client.webhook.update(webhook.id, {
    events: ['onramp.updated', 'achDebitReturn.created', 'achDebitReturn.updated'],
})
```

Webhook requests are signed with HMAC SHA256 using your webhook secret. Verify the signature against the **raw request body** before parsing JSON:

```typescript
import { createHmac, timingSafeEqual } from 'node:crypto'

function verifySpritzWebhook(rawBody: string, signature: string, secret: string) {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const expectedBuffer = Buffer.from(expected, 'utf8')
    const signatureBuffer = Buffer.from(signature, 'utf8')

    if (expectedBuffer.length !== signatureBuffer.length) return false
    return timingSafeEqual(expectedBuffer, signatureBuffer)
}
```

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

The SDK throws typed errors with the status, message, response IDs, and parsed problem payload:

```typescript
import { PermissionDeniedError } from '@spritz-finance/api-client'

try {
    await client.bankAccount.createLinkToken()
} catch (error) {
    if (error instanceof PermissionDeniedError) {
        console.error(error.status) // 403
        console.error(error.message) // human-readable detail
        console.error(error.error?.requirement) // identity verification requirement, if returned
        console.error(error.headers?.requestId)
    }
    throw error
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
| Risk review required         | 409     | `risk_review_required`               |
| Risk rejected                | 409     | `risk_rejected`                      |
| Risk evaluation unavailable  | 409     | `risk_evaluation_unavailable`        |

---

## Sandbox

Use `Environment.Sandbox` for testing. The sandbox base URL is `https://sandbox.spritz.finance`.

### Quick start

1. Create a user and bypass KYC:

    ```bash
    ./scripts/sandbox/run.sh setup-user
    ```

2. Build the SDK bundle and start the interactive demo/evidence server:

    ```bash
    yarn build
    node scripts/sandbox/evidence-server.mjs
    ```

    Open `http://localhost:3001/ach-onramp.html`, enter your credentials, and walk through the full flow. The demo saves redacted QC evidence under `qc/evidence/`.
    The evidence server binds to `127.0.0.1` by default. If you intentionally need a non-local browser to access it, run with `EVIDENCE_HOST=0.0.0.0`.

### Plaid sandbox credentials

When prompted by Plaid Link, use:

- **Username:** `user_good`
- **Password:** `pass_good`

Select any checking account to complete linking.

### Simulating an ACH return

Sandbox lets you create a deposit whose ACH debit is pre-armed to return with a specific NACHA code. The deposit moves through the normal lifecycle and lands in `returned` so you can exercise downstream handling end-to-end (webhooks, the integrator returns API, your reconciliation logic).

Plaid Signal runs during deposit creation. In sandbox, Plaid supports amount-based Signal fixtures. Use the normal generated SDK fields and set the prepared deposit amount to exercise Signal behavior; do not send a `signal` request field.

Useful Signal amount fixtures:

| Amount  | Plaid Signal score | Expected Spritz behavior                           |
| ------- | ------------------ | -------------------------------------------------- |
| `12.17` | `60`               | Medium score, expected allow under local threshold |
| `27.53` | `90`               | High score, expected pre-debit risk block          |

`3.53` maps to score `10`, but it is below the current ACH minimum in this sandbox.

```typescript
// 1. Prepare as normal
const preparation = await client.deposit.prepare({
    sourceId: source.id,
    address: walletAddress,
    network: 'solana',
    asset: 'USDC',
    quoteType: 'exact_input',
    amountUsd: '12.17',
    priority: 'normal',
})

// 2. Use the sandbox creator instead of client.deposit.create
const deposit = await client.sandbox.createDepositWithReturn({
    preparationId: preparation.preparationId,
    returnSimulation: { code: 'R01' }, // NACHA return code to arm
})

// deposit.status will move through authorized → processing → returned
// deposit.returnCode === 'R01', and a matching ACH debit return record
// will appear in client.achDebitReturn.list()
```

**Common NACHA codes for testing:**

| Code  | Reason                            | Bucket           |
| ----- | --------------------------------- | ---------------- |
| `R01` | Insufficient funds                | `administrative` |
| `R02` | Account closed                    | `administrative` |
| `R03` | No account / unable to locate     | `administrative` |
| `R10` | Customer advises unauthorized     | `unauthorized`   |
| `R29` | Corporate customer not authorized | `unauthorized`   |

`R10`/`R29` are the most useful for exercising the unauthorized-return user-action path (`userAction: 'review_required'` or `'disabled'`); `R01` exercises the simpler administrative-loss path.

This endpoint returns 403 in production. The 200 response shape is the same as `client.deposit.create`.

---

## API Reference

| Method   | Endpoint                                      | SDK Method                                    | Description                                                     |
| -------- | --------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| `GET`    | `/v1/bank-accounts/`                          | `client.bankAccount.list()`                   | List bank accounts (canonical list, includes `fundingSourceId`) |
| `GET`    | `/v1/bank-accounts/{accountId}`               | `client.bankAccount.get(id)`                  | Get a single bank account                                       |
| `POST`   | `/v1/bank-accounts/`                          | `client.bankAccount.create(...)`              | Add a bank account by routing/account number                    |
| `DELETE` | `/v1/bank-accounts/{accountId}`               | `client.bankAccount.delete(id)`               | Remove a bank account                                           |
| `POST`   | `/v1/bank-accounts/link-token`                | `client.bankAccount.createLinkToken()`        | Create Plaid link token                                         |
| `POST`   | `/v1/bank-accounts/link-complete`             | `client.bankAccount.completeLinking(...)`     | Complete Plaid linking                                          |
| `GET`    | `/v1/funding-sources/`                        | `client.fundingSource.list()`                 | List funding sources                                            |
| `GET`    | `/v1/funding-sources/{id}`                    | `client.fundingSource.get(id)`                | Get funding source                                              |
| `GET`    | `/v1/funding-sources/{id}/deposit-limits`     | `client.fundingSource.getDepositLimits(id)`   | Get current ACH debit limits                                    |
| `POST`   | `/v1/deposits/direct/prepare`                 | `client.deposit.prepare(...)`                 | Prepare deposit quote                                           |
| `POST`   | `/v1/deposits/direct`                         | `client.deposit.create(...)`                  | Create deposit                                                  |
| `GET`    | `/v1/on-ramps/`                               | `client.onrampPayment.list(...)`              | List on-ramps (canonical deposit lookup)                        |
| `GET`    | `/v1/on-ramps/{onRampId}`                     | `client.onrampPayment.get(id)`                | Get a single on-ramp                                            |
| `GET`    | `/v1/integrator/ach-debit/returns`            | `client.achDebitReturn.list(...)`             | List ACH debit returns                                          |
| `GET`    | `/v1/integrator/ach-debit/returns/{returnId}` | `client.achDebitReturn.get(id)`               | Get a single return                                             |
| `POST`   | `/v1/sandbox/deposits/direct`                 | `client.sandbox.createDepositWithReturn(...)` | Sandbox-only — create a deposit with an armed ACH return        |

All endpoints require a Bearer token (`apiKey`). Integrator requests are additionally signed with HMAC — the SDK handles this automatically when `integratorSecret` is provided.
