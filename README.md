# @spritz-finance/api-client

TypeScript client for the Spritz Finance API — convert crypto to fiat payments.

[![NPM](https://img.shields.io/npm/v/@spritz-finance/api-client.svg)](https://www.npmjs.com/package/@spritz-finance/api-client)

## Installation

```bash
npm install @spritz-finance/api-client
# or
yarn add @spritz-finance/api-client
```

## Quick Start

```typescript
import {
    SpritzApiClient,
    Environment,
    PaymentNetwork,
    BankAccountType,
    BankAccountSubType,
} from '@spritz-finance/api-client'

// Initialize with your integration key
const client = SpritzApiClient.initialize({
    environment: Environment.Sandbox,
    integrationKey: 'YOUR_INTEGRATION_KEY_HERE',
})

// Create a user and set their API key
const user = await client.user.create({ email: 'user@example.com' })
client.setApiKey(user.apiKey)

// Add a bank account
const bankAccount = await client.bankAccount.create(BankAccountType.USBankAccount, {
    accountNumber: '123456789',
    routingNumber: '987654321',
    name: 'My Checking Account',
    ownedByUser: true,
    subType: BankAccountSubType.Checking,
})

// Create a payment request
const paymentRequest = await client.paymentRequest.create({
    amount: 100,
    accountId: bankAccount.id,
    network: PaymentNetwork.Ethereum,
})

// Get transaction data for the blockchain payment
const transactionData = await client.paymentRequest.getWeb3PaymentParams({
    paymentRequest,
    paymentTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
})

// Execute the blockchain transaction from the user's wallet
```

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
    - [Creating a User](#creating-a-user)
    - [Reauthorization](#reauthorization)
    - [User Data](#user-data)
    - [Identity Verification](#identity-verification)
- [Accounts](#accounts)
    - [Bank Accounts](#bank-accounts)
    - [Debit Cards](#debit-cards)
    - [Bills](#bills)
    - [Virtual Cards](#virtual-cards)
    - [Address Book](#address-book)
    - [Renaming Accounts](#renaming-accounts)
    - [Deleting Accounts](#deleting-accounts)
- [Payments (Off-ramp)](#payments-off-ramp)
    - [Payment Flow](#payment-flow)
    - [Creating a Payment Request](#creating-a-payment-request)
    - [Fulfilling a Payment — EVM](#fulfilling-a-payment--evm)
    - [Fulfilling a Payment — Solana](#fulfilling-a-payment--solana)
    - [Transaction Fees](#transaction-fees)
    - [Retrieving Payments](#retrieving-payments)
    - [Payment Limits](#payment-limits)
- [On-ramp](#on-ramp)
    - [Prerequisites](#prerequisites)
    - [Checking User Access](#checking-user-access)
    - [Activation Steps](#activation-steps)
    - [Virtual Accounts](#virtual-accounts)
    - [Supported Tokens](#supported-tokens)
- [ACH Onramp (Direct Debit)](#ach-onramp-direct-debit)
- [Sandbox](#sandbox)
    - [Bypassing KYC](#bypassing-kyc)
- [Webhooks](#webhooks)
    - [Events](#events)
    - [Setup](#setup)
    - [Management](#management)
    - [Security and Signing](#security-and-signing)

## Authentication

Spritz uses two levels of authentication:

- **Integration key** — identifies your application. Provided by Spritz.
- **User API key** — scoped to a single user. Returned when you create a user.

```typescript
import { SpritzApiClient, Environment } from '@spritz-finance/api-client'

const client = SpritzApiClient.initialize({
    environment: Environment.Sandbox,
    integrationKey: 'YOUR_INTEGRATION_KEY_HERE',
    apiKey: 'YOUR_USER_API_KEY_HERE', // omit if no user exists yet
})
```

After creating a user, set their API key on the client:

```typescript
client.setApiKey(user.apiKey)
```

## Users

### Creating a User

```typescript
const user = await client.user.create({
  email: 'bilbo@shiremail.net',
})

// Response
{
  email: 'bilbo@shiremail.net',
  userId: '62d17d3b377dab6c1342136e',
  apiKey: 'ak_ZTBGDcjfdTg3NmYtZDJlZC00ZjYyLThlMDMtZmYwNDJiZDRlMWZm',
}
```

Creating a user with an email that already exists will throw an error.

### Reauthorization

If you need to recover a user's API key (e.g., the user already has a Spritz account, or you've lost access), use the OTP reauthorization flow:

```typescript
// Request an OTP code sent to the user's email
const { success } = await client.user.requestApiKey('bilbo@shiremail.net')

// Confirm with the OTP code the user provides
const { apiKey, userId, email } = await client.user.authorizeApiKeyWithOTP({
    email: 'bilbo@shiremail.net',
    otp: '123456',
})
```

### User Data

```typescript
const userData = await client.user.getCurrentUser()
```

### Identity Verification

All users must complete identity verification before using the platform. New users start with a verification status of `NotStarted`.

The user's verification data is included in the `getCurrentUser` response, including verification status, verification URL, verified country, and retry capability.

#### Getting Verification Parameters

```typescript
const verificationParams = await client.user.getVerificationParams()

// Returns:
// - inquiryId: Unique identifier for this verification inquiry
// - verificationUrl: URL for hosted verification
// - sessionToken: Token for use with Persona's Embedded Flow
// - verificationUrlExpiresAt: Expiration timestamp for the verification URL
```

#### Option 1: Verification URL

The simplest integration — redirect the user to the hosted verification flow:

```typescript
const { verificationUrl, verificationUrlExpiresAt } = await client.user.getVerificationParams()

// Open in a browser tab, iframe, or mobile web view.
// The URL is single-use and short-lived. If it expires or the user
// doesn't complete verification, call getVerificationParams() again.
```

#### Option 2: Embedded Flow

For full control over the UX, use the `inquiryId` and `sessionToken` with [Persona's Embedded Flow](https://docs.withpersona.com/quickstart-embedded-flow):

```typescript
const { inquiryId, sessionToken } = await client.user.getVerificationParams()

// Use inquiryId (and sessionToken if present) with Persona's SDK
// to embed the verification flow directly in your app.
```

#### Handling Verification Failures

When verification fails, the `verificationMetadata` field on the user object provides the failure reason:

| Failure Reason             | Description                  |
| -------------------------- | ---------------------------- |
| `verify_sms`               | SMS verification failed      |
| `documentary_verification` | Document verification failed |
| `risk_check`               | Risk assessment failed       |
| `kyc_check`                | KYC check failed             |
| `watchlist_screening`      | Watchlist screening failed   |
| `selfie_check`             | Selfie verification failed   |
| `address_invalid`          | Invalid address              |
| `duplicate_identity`       | Identity already exists      |

For `duplicate_identity` failures, `matchedEmail` indicates whether the duplicate was created through your integration:

```typescript
const userData = await client.user.getCurrentUser()

if (userData.verificationMetadata?.failureReason === 'duplicate_identity') {
    const matchedEmail = userData.verificationMetadata.details.matchedEmail

    if (matchedEmail) {
        // Duplicate exists within your integration — guide user to their existing account
        console.log(`Already verified as: ${matchedEmail}`)
    } else {
        // Duplicate exists in a different integration (e.g., the main Spritz app)
        console.log('Identity already verified with another Spritz account')
    }
}
```

## Accounts

Spritz supports four account types: **Bank Account**, **Debit Card**, **Bill**, and **Virtual Card**. All are referred to as "accounts" within the platform and share common properties (`id`, `type`, `userId`, `country`, `currency`, `createdAt`), with additional fields specific to each type.

### Bank Accounts

#### List

```typescript
const bankAccounts = await client.bankAccount.list()
```

```typescript
// Example response
;[
    {
        id: '62d17d3b377dab6c1342136e',
        name: 'Precious Savings',
        type: 'BankAccount',
        bankAccountType: 'USBankAccount',
        bankAccountSubType: 'Checking',
        userId: '62d17d3b377dab6c1342136e',
        accountNumber: '1234567',
        bankAccountDetails: {
            routingNumber: '00000123',
        },
        country: 'US',
        currency: 'USD',
        email: 'bilbo@shiremail.net',
        institution: {
            id: '62d27d4b277dab3c1342126e',
            name: 'Shire Bank',
            logo: 'https://tinyurl.com/shire-bank-logo',
        },
        ownedByUser: true,
        createdAt: '2023-05-03T11:25:02.401Z',
        deliveryMethods: ['STANDARD', 'INSTANT'],
    },
]
```

#### Create US Bank Account

```typescript
import { BankAccountType, BankAccountSubType } from '@spritz-finance/api-client'

const bankAccount = await client.bankAccount.create(BankAccountType.USBankAccount, {
    accountNumber: '123456789',
    routingNumber: '987654321',
    name: 'Precious Savings',
    ownedByUser: true,
    subType: BankAccountSubType.Savings,
})
```

Input fields:

```typescript
interface USBankAccountInput {
    accountNumber: string
    routingNumber: string
    subType: BankAccountSubType
    name?: string | null
    email?: string | null
    ownedByUser?: boolean | null
}
```

#### Create Canadian Bank Account

```typescript
import { BankAccountType, BankAccountSubType } from '@spritz-finance/api-client'

const bankAccount = await client.bankAccount.create(BankAccountType.CABankAccount, {
    accountNumber: '123456789',
    transitNumber: '12345',
    institutionNumber: '123',
    name: 'Precious Savings',
    ownedByUser: true,
    subType: BankAccountSubType.Savings,
})
```

Input fields:

```typescript
interface CABankAccountInput {
    accountNumber: string
    transitNumber: string
    institutionNumber: string
    name: string
    subType: BankAccountSubType
    email?: string
    ownedByUser?: boolean | null
}
```

#### Link a US Bank Account with Plaid

Rather than collecting raw account and routing numbers, link a US bank account through [Plaid Link](https://plaid.com/docs/link/). Plaid verifies account ownership, returns institution metadata, and — for ACH-eligible accounts — provisions the **funding source** required for [ACH onramp](#ach-onramp-direct-debit).

> **Plaid Link must be enabled on your integration.** It is gated per account. If `createLinkToken()` returns `403`, contact Spritz to enable it, and fall back to [Create US Bank Account](#create-us-bank-account) in the meantime (see [Fall back to manual entry](#fall-back-to-manual-entry) below).

Linking is a two-part flow: create a link token on your **server**, then run the Plaid Link UI on the **client**. The SDK is server-side only — only the Plaid Link UI runs in the browser.

**1. Create a link token (server)**

```typescript
const { linkToken, hostedLinkUrl, expiration } = await client.bankAccount.createLinkToken()
```

| Field           | Type             | Description                                               |
| --------------- | ---------------- | --------------------------------------------------------- |
| `linkToken`     | `string`         | Token for initializing the Plaid Link SDK                 |
| `hostedLinkUrl` | `string \| null` | Plaid-hosted linking URL (alternative to running the SDK) |
| `expiration`    | `string`         | Token expiry (ISO 8601)                                   |

If a bank uses OAuth, pass the OAuth target as `redirectUri` (see [Handle OAuth redirects](#handle-oauth-redirects)):

```typescript
await client.bankAccount.createLinkToken({
    // Web / iOS: an https:// return URL or iOS universal link
    // Android: your package name (e.g. 'com.example.app')
    redirectUri: 'https://app.example.com/plaid/oauth-return',
})
```

**2. Run Plaid Link (client)**

Hand the `linkToken` to the Plaid Link SDK ([React Native](https://plaid.com/docs/link/react-native/), [Web](https://plaid.com/docs/link/web/), [iOS](https://plaid.com/docs/link/ios/), [Android](https://plaid.com/docs/link/android/)). On success, send the public token and selected account IDs back to your server.

React Native ([`react-native-plaid-link-sdk`](https://github.com/plaid/react-native-plaid-link-sdk) v11+):

```typescript
import { create, open } from 'react-native-plaid-link-sdk'

create({
    token: linkToken,
    onSuccess: async (success) => {
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

open()
```

Web ([`react-plaid-link`](https://github.com/plaid/react-plaid-link) or the vanilla JS SDK):

```typescript
const handler = Plaid.create({
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
        await yourServer.completePlaidLink({
            publicToken,
            accountIds: metadata.accounts.map((a) => a.id),
            // Web SDK uses institution_id; the RN SDK uses id
            institutionId: metadata.institution?.institution_id,
            institutionName: metadata.institution?.name,
        })
    },
})
handler.open()
```

**3. Complete linking (server)**

```typescript
const { bankAccounts } = await client.bankAccount.completeLinking({
    publicToken,
    accountIds,
    institutionId,
    institutionName,
})

// A funding source is provisioned for ACH-eligible accounts. Its presence is
// the signal that the account can be used for ACH onramp.
const onrampable = bankAccounts.find((b) => b.fundingSourceId)
```

`completeLinking` exchanges the public token, stores the linked bank account(s), and provisions a funding source for ACH-eligible accounts. A `null` `fundingSourceId` means the account is usable for off-ramp only. See the [ACH Onramp Integration Guide](docs/ach-onramp-guide.md#bank-accounts-vs-funding-sources) for the bank-account-vs-funding-source model.

##### Handle OAuth redirects

Some institutions send the user out to their bank's OAuth page and redirect back when auth completes. Because Spritz creates the link token, the redirect targets must be **allowlisted on Spritz's Plaid account** — send them to Spritz before going live:

| Platform | What to register                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------- |
| Web      | An HTTPS return URL on a domain you control (e.g. `https://app.example.com/plaid/oauth-return`)         |
| iOS      | The universal link URL you receive the redirect on — custom URL schemes (`yourapp://`) are not accepted |
| Android  | Your app's package name (e.g. `com.example.app`)                                                        |

Pass the same value as `redirectUri` when creating the link token. The client-side work to resume the flow differs per platform (web requires re-initializing Link with `receivedRedirectUri`; native iOS/Android forward the redirect into the in-memory SDK). See [Handle OAuth redirects](docs/ach-onramp-guide.md#1c-handle-oauth-redirects) in the ACH Onramp guide for the full per-platform breakdown.

##### Fall back to manual entry

Plaid Link can be unavailable — it may not be enabled on your integration yet, `createLinkToken()` can fail, or the user may abandon or hit an error in the Link UI. Treat manual account/routing entry as a fallback so users can always add a bank account:

```typescript
import { BankAccountType, BankAccountSubType } from '@spritz-finance/api-client'

try {
    const { linkToken } = await client.bankAccount.createLinkToken()
    // hand linkToken to Plaid Link on the client, then completeLinking(...)
} catch {
    // Plaid unavailable — collect account + routing numbers and create directly
    const bankAccount = await client.bankAccount.create(BankAccountType.USBankAccount, {
        accountNumber: '123456789',
        routingNumber: '987654321',
        subType: BankAccountSubType.Checking,
        ownedByUser: true,
    })
}
```

A manually added account is immediately usable for **off-ramp**. **ACH on-ramp** additionally requires a funding source, and the Plaid link flow is what provisions it — so prefer Plaid Link whenever ACH onramp is in scope, and use manual entry as the off-ramp fallback.

### Debit Cards

Supported networks: **Visa** and **Mastercard**.

#### List

```typescript
const debitCards = await client.debitCard.list()
```

```typescript
// Example response
;[
    {
        id: '62d17d3b377dab6c1342136e',
        type: 'DebitCard',
        name: 'My Visa Debit',
        userId: '62d17d3b377dab6c1342136e',
        country: 'US',
        currency: 'USD',
        payable: true,
        debitCardNetwork: 'Visa',
        expirationDate: '12/25',
        cardNumber: '4111111111111111',
        mask: '1111',
        createdAt: '2023-01-01T00:00:00Z',
        paymentCount: 5,
        externalId: 'ext-123',
    },
]
```

#### Create

```typescript
const debitCard = await client.debitCard.create({
    cardNumber: '4111111111111111', // 13-19 digits
    expirationDate: '12/25', // MM/YY
    name: 'My Visa Debit', // optional
})
```

### Bills

#### List

```typescript
const bills = await client.bill.list()
```

```typescript
// Example response
;[
    {
        id: '62d17d3b377dab6c1342136e',
        name: 'Precious Credit Card',
        type: 'Bill',
        billType: 'CreditCard',
        userId: '62d17d3b377dab6c1342136e',
        mask: '4567',
        originator: 'User',
        payable: true,
        verifying: false,
        billAccountDetails: {
            balance: 240.23,
            amountDue: 28.34,
            openedAt: '2023-05-03T11:25:02.401Z',
            lastPaymentAmount: null,
            lastPaymentDate: null,
            nextPaymentDueDate: '2023-06-03T11:25:02.401Z',
            nextPaymentMinimumAmount: 28.34,
            lastStatementBalance: 180.23,
            remainingStatementBalance: null,
        },
        country: 'US',
        currency: 'USD',
        dataSync: {
            lastSync: '2023-05-03T11:25:02.401Z',
            syncStatus: 'Active',
        },
        institution: {
            id: '62d27d4b277dab3c1342126e',
            name: 'Shire Bank Credit Card',
            logo: 'https://tinyurl.com/shire-bank-logo',
        },
        createdAt: '2023-05-03T11:25:02.401Z',
        deliveryMethods: ['STANDARD'],
    },
]
```

#### Create

Adding a bill requires the institution ID and the account number:

```typescript
import { BillType } from '@spritz-finance/api-client'

const institutions = await client.institution.popularUSBillInstitutions(BillType.CreditCard)
const bill = await client.bill.create(institutions[0].id, '12345678913213', BillType.CreditCard)
```

#### Finding Bill Institutions

```typescript
// Popular institutions (optionally filtered by bill type)
const popular = await client.institution.popularUSBillInstitutions()
const mortgages = await client.institution.popularUSBillInstitutions(BillType.Mortgage)

// Search by name
const results = await client.institution.searchUSBillInstitutions('american express')
const filtered = await client.institution.searchUSBillInstitutions(
    'american express',
    BillType.CreditCard
)
```

### Virtual Cards

Virtual cards are crypto-funded payment cards.

#### Fetch

Returns card details excluding sensitive fields (card number, CVV):

```typescript
const virtualCard = await client.virtualCard.fetch()
```

```typescript
// Example response
{
  id: '62d17d3b377dab6c1342136e',
  type: 'VirtualCard',
  virtualCardType: 'USVirtualDebitCard',
  userId: '62d17d3b377dab6c1342136e',
  mask: '0001',
  country: 'US',
  currency: 'USD',
  balance: 0,
  renderSecret: 'U2FsdGVkX18bLYGYLILf4AeW5fOl8VYxAvKWVDtbZI5DO7swFqkJ2o',
  billingInfo: {
    holder: 'Bilbo Baggins',
    phone: '+123456789',
    email: 'bilbo@shiremail.net',
    address: {
      street: '1 Bagshot Row',
      street2: '',
      city: 'Hobbiton',
      subdivision: 'The Shire',
      postalCode: '12345',
      countryCode: 'ME',
    },
  },
}
```

#### Create

```typescript
import { VirtualCardType } from '@spritz-finance/api-client'

const virtualCard = await client.virtualCard.create(VirtualCardType.USVirtualDebitCard)
```

#### Displaying Sensitive Card Details

To render the full card number and CVV, use the `renderSecret` from the fetch response with one of the Spritz secure element libraries:

- [React](https://www.npmjs.com/package/@spritz-finance/react-secure-elements)
- [React Native](https://www.npmjs.com/package/@spritz-finance/react-native-secure-elements)

### Address Book

Each account is allocated a unique on-chain payment address per network. Tokens sent to these addresses are automatically credited to the account. Accepted tokens vary by network — generally USDC and USDT at minimum.

```typescript
// Included in account responses
{
  paymentAddresses: [
    { network: 'ethereum', address: '0xc0ffee254729296a45a3885639AC7E10F9d54979' },
    { network: 'polygon', address: '0xc0ffee254729296a45a3885639AC7E10F9d54979' },
  ],
}
```

### Renaming Accounts

```typescript
await client.bankAccount.rename('account-id', 'New Name')
await client.debitCard.rename('card-id', 'New Name')
await client.bill.rename('bill-id', 'New Name')
```

### Deleting Accounts

```typescript
await client.bankAccount.delete('account-id')
await client.debitCard.delete('card-id')
await client.bill.delete('bill-id')
```

## Payments (Off-ramp)

### Payment Flow

1. **Select an account** — choose the bank account, debit card, or bill to pay.
2. **Create a payment request** — specify amount, account ID, and blockchain network.
3. **Get transaction data** — call `getWeb3PaymentParams` (EVM) or `getSolanaPaymentParams` (Solana).
4. **Execute the blockchain transaction** — sign and submit from the user's wallet.
5. **Check payment status** — query the resulting fiat payment.

> Your application needs a connection to the user's wallet to sign transactions. If you don't have one, consider [Web3Modal](https://github.com/WalletConnect/web3modal) or [Web3-Onboard](https://onboard.blocknative.com/docs/overview/introduction#features).

### Creating a Payment Request

```typescript
import { PaymentNetwork, AmountMode } from '@spritz-finance/api-client'

const paymentRequest = await client.paymentRequest.create({
    amount: 100,
    accountId: account.id,
    network: PaymentNetwork.Ethereum,
    deliveryMethod: 'INSTANT', // optional
    amountMode: AmountMode.TOTAL_AMOUNT, // optional, defaults to AMOUNT_RECEIVED
})
```

```typescript
// Example response
{
  id: '645399c8c1ac408007b12273',
  userId: '63d12d3B577fab6c6382136e',
  accountId: '6322445f10d3f4d19c4d72fe',
  status: 'CREATED',
  amount: 100,
  feeAmount: 0,
  amountDue: 100,
  network: 'ethereum',
  createdAt: '2023-05-04T11:40:56.488Z',
}
```

#### Amount Mode

- **`AMOUNT_RECEIVED`** (default) — the recipient receives the specified amount; fees are added on top.
- **`TOTAL_AMOUNT`** — the specified amount includes fees; the recipient receives less.

#### Fee Subsidies

Integrators can subsidize transaction fees on behalf of users. This is a gated feature — contact Spritz to enable it.

```typescript
const paymentRequest = await client.paymentRequest.create({
    amount: 100,
    accountId: account.id,
    network: PaymentNetwork.Ethereum,
    feeSubsidyPercentage: '100', // percentage of fee to cover
    maxFeeSubsidyAmount: '5', // cap per transaction in USD
})

// Fee = $3 → integrator pays $3, user pays $0
// Fee = $8 → integrator pays $5, user pays $3
```

Subsidized amounts are invoiced to the integrator separately.

### Fulfilling a Payment — EVM

For EVM networks, you interact with the SpritzPay smart contract ([deployment addresses](https://docs.spritz.finance/docs/deployment-addresses)):

```typescript
const transactionData = await client.paymentRequest.getWeb3PaymentParams({
  paymentRequest,
  paymentTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
})

// Example response
{
  contractAddress: '0xbF7Abc15f00a8C2d6b13A952c58d12b7c194A8D0',
  method: 'payWithToken',
  calldata: '0xd71d9632...',
  value: null,
  requiredTokenInput: '100000000',
}
```

Use `contractAddress` as `to`, `calldata` as `data`, and `value` to build the transaction. Check `requiredTokenInput` against the user's balance before submitting.

### Fulfilling a Payment — Solana

```typescript
const transactionData = await client.paymentRequest.getSolanaPaymentParams({
  paymentRequest,
  paymentTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  signer: 'YourSolanaWalletAddress',
})

// Example response
{
  versionedTransaction: VersionedTransaction, // ready to sign
  transactionSerialized: 'base64...',          // base64-encoded alternative
}
```

### Transaction Fees

Fees apply once monthly volume exceeds $100. To check the fee for a given amount:

```typescript
const fee = await client.paymentRequest.transactionPrice(101)
// Returns: 0.01
```

### Retrieving Payments

Payments are created once a payment request reaches `Confirmed` status.

```typescript
// By payment ID
const payment = await client.payment.fetchById('6368e3a3ec516e9572bbd23b')

// By payment request ID
const payment = await client.payment.getForPaymentRequest(paymentRequest.id)

// All payments for an account
const payments = await client.payment.listForAccount(account.id)
```

```typescript
// Example response
{
  id: '6368e3a3ec516e9572bbd23b',
  userId: '63d12d3B577fab6c6382136e',
  status: 'COMPLETED',
  accountId: '6322445f10d3f4d19c4d72fe',
  amount: 100,
  feeAmount: null,
  createdAt: '2022-11-07T10:53:23.998Z',
  transaction: {
    hash: '0x1234...abcdef',
    from: '0xYourWalletAddress',
    asset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    value: 100000000,
    network: 'ethereum',
  },
}
```

### Payment Limits

```typescript
const limits = await client.payment.getPaymentLimits(account.id)

// Example response
{
  perTransaction: 20000,
  dailyRemainingVolume: 150000,
}
```

## On-ramp

The on-ramp feature allows users to purchase crypto stablecoins via ACH or wire transfer.

### Prerequisites

1. Complete platform-level KYC (identity verification)
2. Accept the third-party on-ramp provider's Terms of Service
3. Provider KYC processes automatically after ToS acceptance

### Checking User Access

```typescript
const access = await client.user.getUserAccess()

// Off-ramp capabilities
if (access.capabilities.offramp.active) {
    console.log('Off-ramp features:', access.capabilities.offramp.features)
    // US: 'us_bank_account', 'us_debit_card'
    // CA: 'ca_bank_account'
}

// On-ramp capabilities
if (access.capabilities.onramp.active) {
    console.log('On-ramp features:', access.capabilities.onramp.features)
    // May include: 'ach_purchase', 'wire_purchase'
} else {
    for (const req of access.capabilities.onramp.requirements) {
        console.log(`${req.type}: ${req.description}`)
    }
}
```

### Activation Steps

#### 1. Complete Platform KYC

```typescript
const access = await client.user.getUserAccess()

if (!access.kycStatus.verified) {
    if (access.kycRequirement?.actionUrl) {
        console.log('Complete KYC at:', access.kycRequirement.actionUrl)
    }
    if (access.kycRequirement?.status === 'failed' && access.kycRequirement.retryable) {
        await client.user.retryFailedVerification()
    }
}
```

#### 2. Accept Terms of Service

```typescript
const access = await client.user.getUserAccess()
const tosRequirement = access.capabilities.onramp.requirements.find(
    (req) => req.type === 'terms_acceptance'
)

if (tosRequirement?.actionUrl) {
    // Display tosRequirement.actionUrl in a browser tab, iframe, or webview.
    // Listen for the signedAgreementId via postMessage:
    window.addEventListener('message', (event) => {
        if (event.data.signedAgreementId) {
            await client.onramp.acceptTermsOfService(event.data.signedAgreementId)
        }
    })
}
```

#### 3. Wait for Provider KYC

Provider KYC runs automatically after ToS acceptance. No action required — monitor the status:

```typescript
const access = await client.user.getUserAccess()
const kycReq = access.capabilities.onramp.requirements.find(
    (req) => req.type === 'identity_verification'
)

// kycReq is undefined when complete, otherwise check kycReq.status ('pending' | 'failed')
```

Use the `capabilities.updated` webhook event to be notified when the user's capabilities change.

### Virtual Accounts

Once on-ramp is active, users can create virtual accounts to receive fiat deposits:

```typescript
import { PaymentNetwork, onrampSupportedTokens } from '@spritz-finance/api-client'

// Check supported tokens for a network
const tokens = onrampSupportedTokens[PaymentNetwork.Ethereum]
// ['USDC', 'USDT', 'DAI', 'USDP', 'PYUSD']

// Create a virtual account
const virtualAccount = await client.virtualAccounts.create({
    network: PaymentNetwork.Ethereum,
    address: '0xYourEthereumAddress',
    token: 'USDC',
})

// Deposit instructions for funding via ACH/wire
const { bankName, bankAccountNumber, bankRoutingNumber, bankAddress } =
    virtualAccount.depositInstructions

// List all virtual accounts
const accounts = await client.virtualAccounts.list()
```

### Supported Tokens

| Network   | Tokens                       |
| --------- | ---------------------------- |
| Ethereum  | USDC, USDT, DAI, USDP, PYUSD |
| Polygon   | USDC                         |
| Base      | USDC                         |
| Arbitrum  | USDC                         |
| Avalanche | USDC                         |
| Optimism  | USDC                         |
| Solana    | USDC, PYUSD                  |
| Tron      | USDT                         |

## ACH Onramp (Direct Debit)

ACH onramp lets users convert USD from their bank account into USDC delivered to a Solana wallet. The integration is a short server-side flow with one client-side Plaid step:

1. **Server:** create a Plaid link token with `client.bankAccount.createLinkToken()`
2. **Client:** run Plaid Link and send the public token/account IDs back to your server
3. **Server:** complete linking with `client.bankAccount.completeLinking(...)`
4. **Server:** find an active funding source and fetch limits with `client.fundingSource.getDepositLimits(id)`
5. **Server:** prepare a quote with `client.deposit.prepare(...)`
6. **Client:** show the quote and ACH authorization message to the user
7. **Server:** create the deposit with `client.deposit.create(...)`; Spritz runs risk checks before initiating the ACH pull

Authorization is derived from the verified ACH funding source — no wallet signature is required.

If risk checks block the create step, the API returns 409 before any ACH debit is pulled. Prepare a new quote before retrying; blocked create attempts consume the original `preparationId`.

For a complete walkthrough with code examples, request/response schemas, and deposit lifecycle documentation, see the **[ACH Onramp Integration Guide](docs/ach-onramp-guide.md)**.

A standalone sandbox demo is available at `scripts/sandbox/ach-onramp.html`. Run `yarn build && node scripts/sandbox/evidence-server.mjs`, then open `http://localhost:3001/ach-onramp.html` to test the SDK-backed flow and save redacted QC evidence.

## Sandbox

Use `Environment.Sandbox` for development and testing. The sandbox environment is available at `https://sandbox.spritz.finance`.

### Bypassing KYC

In sandbox, you can skip identity verification to speed up testing:

```typescript
// Simulate successful US KYC verification
await client.sandbox.bypassKyc()

// Simulate KYC for a specific country
await client.sandbox.bypassKyc({ country: 'CA' })

// Simulate a failed KYC check
await client.sandbox.bypassKyc({ failed: true })
```

This endpoint returns 403 in production.

## Webhooks

### Events

#### Account Events

- `account.created` — new account created
- `account.updated` — account details updated
- `account.deleted` — account deleted

#### Payment Events

- `payment.created` — payment initiated
- `payment.updated` — payment details updated
- `payment.completed` — payment completed
- `payment.refunded` — payment refunded

#### Verification Events

- `verification.status.updated` — user verification status changed

#### Capability Events

- `capabilities.updated` — user capabilities changed

#### On-Ramp Events

- `onramp.created` — on-ramp record created after a deposit is authorized
- `onramp.updated` — on-ramp status, delivery, or reversal details updated
- `onramp.completed` — on-ramp delivery completed

#### ACH Debit Return Events

- `achDebitReturn.created` — ACH debit return recorded
- `achDebitReturn.updated` — ACH debit return details updated

Use `'*'` to subscribe a webhook endpoint to all current and future webhook events.

### Setup

```typescript
const webhook = await client.webhook.create({
    url: 'https://my.webhook.url/spritz',
    events: ['onramp.created', 'onramp.updated', 'achDebitReturn.created'],
})

// Subscribe to all events
await client.webhook.create({
    url: 'https://my.webhook.url/spritz/all',
    events: ['*'],
})
```

Webhook payloads have the following shape:

```json
{
    "userId": "user-id",
    "id": "resource-id",
    "eventName": "event-name"
}
```

### Management

```typescript
// List all webhooks
const webhooks = await client.webhook.list()

// Update a webhook's event subscriptions
await client.webhook.update('webhook-id', {
    events: ['onramp.updated', 'achDebitReturn.created', 'achDebitReturn.updated'],
})

// Delete a webhook
await client.webhook.delete('webhook-id')
```

### Security and Signing

Webhook requests are signed with HMAC SHA256 using your webhook secret. The signature is sent in the `Signature` HTTP header. Verify the signature against the raw request body before parsing JSON.

#### Setting a Webhook Secret

```typescript
await client.webhook.updateWebhookSecret('your-secret')
```

#### Verifying Signatures

```typescript
import { createHmac, timingSafeEqual } from 'node:crypto'

function verifySpritzWebhook(rawBody: string, signature: string, secret: string) {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const expectedBuffer = Buffer.from(expected, 'utf8')
    const signatureBuffer = Buffer.from(signature, 'utf8')

    if (expectedBuffer.length !== signatureBuffer.length) return false
    return timingSafeEqual(expectedBuffer, signatureBuffer)
}

const signature = request.headers['signature']
if (!signature || !verifySpritzWebhook(rawBody, signature, WEBHOOK_SECRET)) {
    throw new Error('Invalid webhook signature')
}
```
