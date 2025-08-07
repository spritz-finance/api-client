# @spritz-finance/api-client

A Typescript library for interacting with the Spritz Finance API

[![NPM](https://img.shields.io/npm/v/@spritz-finance/api-client.svg)](https://www.npmjs.com/package/@spritz-finance/api-client)

## Installation

### Using npm

```bash
 npm install --save @spritz-finance/api-client
```

### Using yarn

```bash
 yarn add @spritz-finance/api-client
```

## Quick Start

Get started with Spritz in minutes:

```typescript
import {
  SpritzApiClient,
  Environment,
  PaymentNetwork,
  BankAccountType,
  BankAccountSubType,
  DebitCardNetwork,
  AmountMode,
} from '@spritz-finance/api-client'

// Initialize the client with your integration key
const client = SpritzApiClient.initialize({
  environment: Environment.Sandbox,
  integrationKey: 'YOUR_INTEGRATION_KEY_HERE',
})

// Create a user
const user = await client.user.create({
  email: 'user@example.com',
})

// Set the user's API key
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

// Get transaction data for blockchain payment
const transactionData = await client.paymentRequest.getWeb3PaymentParams({
  paymentRequest,
  paymentTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on mainnet
})

// Use transactionData to execute blockchain transaction in your app
```

## Table of contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [API Overview](#api-overview)
  - [Creating a user](#creating-a-user)
  - [Capabilities of the API Key](#capabilities-of-the-api-key)
- [Usage](#usage)
- [User Management](#user-management)
  - [Creating a user](#creating-a-user-1)
  - [Setting the User API Key](#setting-the-user-api-key)
  - [Reauthorizing a user](#reauthorizing-a-user)
  - [Basic User Data](#basic-user-data)
  - [User Verification](#user-verification)
- [Payment Flow](#payment-flow)
  - [Basic payment flow](#basic-payment-flow)
  - [Note on Issuing the Blockchain Transaction](#note-on-issuing-the-blockchain-transaction)
  - [Example](#example)
- [Accounts](#accounts)
  - [Account Types](#account-types)
  - [Commonalities & Differences](#commonalities---differences)
  - [Bank Accounts](#bank-accounts)
  - [Debit Cards](#debit-cards)
  - [Bills](#bills)
  - [Virtual Card](#virtual-card)
  - [Address Book](#address-book)
- [Account Management](#account-management)
  - [Renaming accounts](#renaming-accounts)
  - [Deleting accounts](#deleting-accounts)
- [Bill Institutions](#bill-institutions)
  - [Fetching popular bill institutions](#fetching-popular-bill-institutions)
  - [Searching for bill institutions by name](#searching-for-bill-institutions-by-name)
- [Payment Requests](#payment-requests)
  - [Create a payment request](#create-a-payment-request)
  - [Fulfil a payment request (EVM transactions)](#fulfil-a-payment-request--evm-transactions-)
  - [Fulfil a payment request (Solana transactions)](#fulfil-a-payment-request--solana-transactions-)
  - [Transaction fees](#transaction-fees)
- [Payments](#payments)
  - [Retrieve the payment for a payment request](#retrieve-the-payment-for-a-payment-request)
  - [Retrieve all payments for an account](#retrieve-all-payments-for-an-account)
- [Onramp Payments](#onramp-payments)
  - [Create an onramp payment](#create-onramp-payment)
  - [Retrieve all onramp payments for an account](#retrieve-all-onramp-payments-for-an-account)
- [Webhooks](#webhooks)
  - [Supported webhook events](#supported-webhook-events)
  - [Setting up webhooks](#setting-up-webhooks)

## API Overview

**Purpose**: As an integrator, this guide will assist you in creating users and performing user-specific operations on the Spritz platform using the provided API key.

### Creating a user

When you create a user using your integration key:

- You will receive an `API key` specific to that user.
- This enables you to interact with the Spritz platform on the user's behalf.

### Capabilities of the API Key

Using the user-specific API key, you can:

1. **Identity Verification**: Guide a user through the identity verification process.
2. **Account Addition**:
   - Add Bills for the user.
   - Register Bank accounts.
   - Issue Virtual cards.
3. **Payment Requests**: Initiate payment requests to the aforementioned accounts.
4. **Blockchain Transactions**: Issue blockchain-based transactions to fulfill the payment requests.
5. **Payment Status**: Query the status of payments directed to the user's accounts.

## Usage

Your integration key is provided by Spritz and must always be provided.
The api key is specific to each user,
and is returned once the user is created. Leave the api key blank if you haven't created the user yet.

```typescript
import { SpritzApiClient, Environment } from '@spritz-finance/api-client'

const client = SpritzApiClient.initialize({
  environment: Environment.Sandbox,
  apiKey: 'YOUR_USER_API_KEY_HERE',
  integrationKey: 'YOUR_INTEGRATION_KEY_HERE',
})
```

## User Management

### Creating a user

To create a new Spritz user, all you need is the user's email address. Note that trying to create a user with an email that already exists in the Spritz platform will throw an error.

```typescript
const user = await client.user.create({
  email: 'bilbo@shiremail.net',
})

// Response
user = {
  email: "bilbo@shiremail.net"
  userId: "62d17d3b377dab6c1342136e",
  apiKey: "ak_ZTBGDcjfdTg3NmYtZDJlZC00ZjYyLThlMDMtZmYwNDJiZDRlMWZm"
}
```

### Setting the User API Key

After creating a user, you can easily set the user's API key onto your initialized client using the provided method:

```typescript
client.setApiKey(user.apiKey)
```

Now you're ready to issue requests on behalf of the user.

### Reauthorizing a user

There is a scenrio where you may need to get access to a users API key again. This can happen if you are trying to sign in a user that already has a Spritz account, or if you have lost access to their API key. In this case, you can reauthorize the user by providing their email. The process is that we will send the user an OTP code to their email, and then the user must pass that code on to you to confirm that they are allowing you to interact with their account on their behalf.

```typescript
const { success } = await client.user.requestApiKey('bilbo@shiremail.net')

const { apiKey, userId, email } = await client.user.authorizeApiKeyWithOTP({
  email: 'bilbo@shiremail.net',
  otp: '123456',
})
```

### Basic User Data

Use this to fetch the user's basic data

```typescript
const userData = await client.user.getCurrentUser()
```

### User Verification

**Purpose**: To ensure users are properly identified before interacting with the Spritz platform.

### Overview

All users must undergo basic identity verification before they can engage with the Spritz platform's features.

### Process

1. **User Creation**: Upon the creation of a new user, their default verification status will be set to `NotStarted`.

2. **Checking Verification Status**: The user's verification data is included in the `getCurrentUser` response, including verification status, verification URL, verified country, and retry capability.

3. **Verification Transition**: Once a user completes the identity verification process, their status will change from `NotStarted` to `Verified`. Only then can the user fully interact with the platform.

4. **Getting Verification URL**: The verification URL is included in the user data response and is essential for the user to proceed with their identity verification.

### How to Present Verification Flow to the User

Spritz offers two methods for integrating KYC verification:

#### Method 1: Verification URL (Simple Integration)

Use the `verificationUrl` for a straightforward integration where Spritz handles the entire verification flow:

- **Browser**: Open the URL in a new browser tab.
- **In-App**: Embed the URL in an iframe within your application.
- **Mobile**: If your platform is mobile-based, open the URL in a native mobile web view.
- **Email**: Send users an email containing the link, prompting them to complete the identity verification.

```typescript
const userData = await client.user.getCurrentUser()
// Access verification data directly from user object
const verificationStatus = userData.verificationStatus
const verificationUrl = userData.verificationUrl
const verifiedCountry = userData.verifiedCountry
const canRetryVerification = userData.canRetryVerification
```

#### Method 2: Verification Token (Advanced Integration)

For more control over the verification experience, use the verification token approach with the Plaid Link SDK:

```typescript
// Get a verification token from Spritz
const verificationToken = await client.user.getVerificationToken()

// Use the token with Plaid Link SDK to create a custom verification flow
// This allows you to:
// - Customize the UI/UX of the verification process
// - Handle callbacks and events directly
// - Integrate verification seamlessly into your application flow
```

The verification token method is ideal when you want to:
- Maintain full control over the user experience
- Integrate verification directly into your app without redirects
- Handle verification events and callbacks programmatically
- Build a native mobile experience using Plaid's mobile SDKs

See the [Plaid Link documentation](https://plaid.com/docs/link/) for detailed integration instructions with the verification token.

## Payment Flow

### Basic payment flow

Execute a payment in a few simple steps:

1. **Select an Account**: Choose the account you wish to pay to.
2. **Initiate Payment Request**: Use the account's ID, your desired payment amount, and the chosen blockchain network to create a payment request.
3. **Retrieve Transaction Data**: Use the `getWeb3PaymentParams` method to obtain the necessary transaction data for fulfilling the payment request.
4. **Blockchain Transaction**: Issue the required blockchain transaction from the user's wallet.
5. **Payment Confirmation**: After blockchain transaction confirmation, check the status of the TradFi payment.

### Note on Issuing the Blockchain Transaction

For Spritz to process a TradFi payment to an account, we need to receive a blockchain transaction on our smart contract, which provides us the crypto funds. As an integrator, it's essential to manage how the blockchain transaction is initiated from the user's wallet to Spritz.

- **Wallet Apps**: If your application functions as a wallet, prompt the user to sign a transaction using data from `getWeb3PaymentParams`.
- **Web-based Dapps**: Use your existing connection to the user's wallet to prompt a transaction.

If your application doesn't have a connection to the user's wallet, consider implementing one. Some popular options include:

- [Web3Modal (Web-based)](https://github.com/WalletConnect/web3modal)
- [Web3Modal (React Native)](https://github.com/WalletConnect/modal-react-native)
- [Web3-Onboard](https://onboard.blocknative.com/docs/overview/introduction#features)

### Example

```typescript
// Fetch all bank accounts for the user
const bankAccounts = await client.bankAccount.list()

// Choose a bank account to use for the payment request
const account = bankAccounts[0]

// Create a payment request for the selected bank account
const paymentRequest = await client.paymentRequest.create({
  amount: 100,
  accountId: account.id,
  network: PaymentNetwork.Ethereum,
})

// Retrieve the transaction data required to issue a blockchain transaction
const transactionData = await client.paymentRequest.getWeb3PaymentParams({
  paymentRequest,
  paymentTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on mainnet
})

/**
 * Issue blockchain transaction with the transaction data
 * and wait for confirmation
 **/

// Retrieve the payment issued for the payment request to check the payment status and confirmation
const payment = await client.payment.getForPaymentRequest(paymentRequest.id)
```

## Accounts

Spritz emphasizes its capabilities in account handling and payment processing.

### Account Types

Spritz supports four distinct types of accounts:

1. **Bank Account**
2. **Debit Card**
3. **Bill**
4. **Virtual Card**

Though each account type possesses its unique creation process and specific properties, it's important to understand that all of them are uniformly termed as an "account" within the Spritz platform.

### Commonalities & Differences

- **Common Properties**: Every type of account shares certain properties consistent across the platform.
- **Unique Properties**: Each account type also has attributes specific to its nature and functionality.

Recognizing these nuances is crucial for optimal interaction with the Spritz platform's account-related features.

### Bank Accounts

Spritz offers a dedicated interface to manage bank accounts, allowing seamless listing and addition of bank account details for users.

#### List user bank accounts

To retrieve all bank accounts linked to a user:

```typescript
const bankAccounts = await client.bankAccount.list()
```

The `bankAccount.list()` method returns an array of user-linked bank accounts, complete with essential details to display in a UI and facilitate payments:

```typescript
const bankAccounts = [{
  id: "62d17d3b377dab6c1342136e",
  name: "Precious Savings",
  type: "BankAccount",
  bankAccountType: "USBankAccount",
  bankAccountSubType: "Checking",
  userId: "62d17d3b377dab6c1342136e",
  accountNumber: "1234567",
  bankAccountDetails: {
    routingNumber: "00000123",
  }
  country: "US",
  currency: "USD",
  email: "bilbo@shiremail.net",
  institution: {
    id: "62d27d4b277dab3c1342126e",
    name: "Shire Bank",
	logo: "https://tinyurl.com/shire-bank-logo",
  },
  ownedByUser: true,
  createdAt: "2023-05-03T11:25:02.401Z",
  deliveryMethods: ['STANDARD', 'INSTANT']
}]
```

#### Add US bank account

Currently, Spritz supports the addition of US bank accounts:

The input structure for adding a US bank account is defined as:

```typescript
// Input arguments for creating a US bank account
export interface USBankAccountInput {
  accountNumber: string
  email?: string | null
  name?: string | null
  ownedByUser?: boolean | null
  routingNumber: string
  subType: BankAccountSubType
}
```

```typescript
import { BankAccountType, BankAccountSubType } from '@spritz-finance/api-client'

const bankAccounts = await client.bankAccount.create(BankAccountType.USBankAccount, {
  accountNumber: '123456789',
  routingNumber: '987654321',
  name: 'Precious Savings',
  ownedByUser: true,
  subType: BankAccountSubType.Savings,
})
```

#### Add Canadian bank account

Currently, Spritz supports the addition of Canadian bank accounts:

The input structure for adding a Canadian bank account is defined as:

```typescript
// Input arguments for creating a Canadian bank account
export interface CABankAccountInput {
  accountNumber: string
  email?: string
  name: string
  ownedByUser?: boolean | null
  transitNumber: string
  institutionNumber: string
  subType: BankAccountSubType
}
```

```typescript
import { BankAccountType, BankAccountSubType } from '@spritz-finance/api-client'

const bankAccounts = await client.bankAccount.create(BankAccountType.CABankAccount, {
  accountNumber: '123456789',
  transitNumber: '12345',
  institutionNumber: '123',
  name: 'Precious Savings',
  ownedByUser: true,
  subType: BankAccountSubType.Savings,
})
```

### Debit Cards

Spritz provides support for adding debit cards as payment accounts, allowing users to make payments directly to their debit cards.

#### List user debit cards

To retrieve all debit cards linked to a user:

```typescript
const debitCards = await client.debitCard.list()
```

The `debitCard.list()` method returns an array of user-linked debit cards:

```typescript
const debitCards = [
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

#### Add a debit card

To add a new debit card for a user:

```typescript
import { DebitCardNetwork } from '@spritz-finance/api-client'

const debitCard = await client.debitCard.create({
  name: 'My Visa Debit',
  cardNumber: '4111111111111111',
  expirationDate: '12/25',
})
```

The input structure for adding a debit card is:

```typescript
export interface DebitCardInput {
  name?: string | null // Optional name for the card
  cardNumber: string // Full card number (13-19 digits)
  expirationDate: string // Expiration date in MM/YY format
}
```

Supported debit card networks:

- `Visa`
- `Mastercard`

### Bills

Spritz provides robust support for bills, allowing seamless management and interaction with user billing accounts. Below is a guide to the methods and functionalities specifically designed for handling bills within Spritz.

#### List user bills

To retrieve all bill accounts associated with a user:

```typescript
const bills = await client.bill.list()
```

The `bill.list()` method returns an array of user-associated bills, complete with essential details for display in a UI and for processing payments:

```typescript
const bills = [
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

#### Add US bill account

Currently, Spritz allows the addition of US bill accounts only. The process involves identifying the institution managing the bill and inputting the bill's account number. Here's a guide on how to add a bill for a user:

```typescript
import { BillType } from '@spritz-finance/api-client'

const institutions = await client.institution.popularUSBillInstitutions(BillType.CreditCard)
const billInstitution = institutions[0]
const accountNumber = '12345678913213'

const bill = await client.bill.create(billInstitution.id, accountNumber, BillType.CreditCard)
```

### Virtual Card

Spritz offers the ability to create virtual cards that users can fund using cryptocurrency. These virtual cards represent an alternative payment account offered by Spritz. To effectively interact with the Virtual Card feature, use the API endpoints detailed below.

#### Fetch a users virtual card

The fetch endpoint returns an object containing details associated with the virtual card. Importantly, this object excludes sensitive card information such as the card number and the CVV.

```typescript
const virtualCard = await client.virtualCard.fetch()
```

```typescript
const virtualCard = {
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

#### Create a US virtual debit card

```typescript
import { VirtualCardType } from '@spritz-finance/api-client'

const virtualCard = await client.virtualCard.create(VirtualCardType.USVirtualDebitCard)
```

#### Displaying sensitive card details

To show the sensitive card details that users require for payment transactions, you must integrate our dedicated drop-in widget. This widget securely renders card details. Use the renderSecret, obtained from the standard fetch card endpoint, in conjunction with the user's API key.

We currently support and maintain the following packages for the card rendering process:

- [React Library](https://www.npmjs.com/package/@spritz-finance/react-secure-elements)
- [React Native Library](https://www.npmjs.com/package/@spritz-finance/react-native-secure-elements)

## Address Book

Each account created in Spritz is allocated a unique on-chain payment address for each network. Tokens transferred to this address will be picked up and credited to the account. A list of the addresses, one per network, is available under the `paymentAddresses` property. Refer to the Spritz UI for which tokens are accepted for these addresses -- generally, we accept at least USDC and USDT on all networks which we integrate with.

```typescript
[
  {
    id: '62d17d3b377dab6c1342136e',
    name: 'Precious Credit Card',
    type: 'Bill',
    billType: 'CreditCard',
    ...
    paymentAddresses: [
      {
        network: 'ethereum',
        address: '0xc0ffee254729296a45a3885639AC7E10F9d54979',
      },
      {
        network: 'polygon',
        address: '0xc0ffee254729296a45a3885639AC7E10F9d54979',
      },
    ],
  },
]
```

## Account Management

### Renaming accounts

#### Rename a bank account

You can conveniently change the display name of a bank account using the following endpoint. The first argument specifies the ID of the bank account, while the second argument represents the desired new name for the account.

```typescript
const updateAccount = await client.bankAccount.rename('62d17d3b377dab6c1342136e', 'My new account')
```

#### Rename a debit card

You can change the display name of a debit card:

```typescript
const updatedCard = await client.debitCard.rename(
  '62d17d3b377dab6c1342136e',
  'My primary debit card'
)
```

#### Rename a bill

You can conveniently change the display name of a bill using the following endpoint. The first argument specifies the ID of the bill, while the second argument represents the desired new name for the account.

```typescript
const updateAccount = await client.bill.rename('62d17d3b377dab6c1342136e', 'My first credit card')
```

### Deleting accounts

#### Delete a bank account

To remove a bank account from a user's account, you can use the following endpoint. You only need to specify the ID of the bank account that you want to delete as an argument.

```typescript
await client.bankAccount.delete('62d17d3b377dab6c1342136e')
```

#### Delete a debit card

To remove a debit card from a user's account:

```typescript
await client.debitCard.delete('62d17d3b377dab6c1342136e')
```

#### Delete a bill

To remove a bill from a user's account, you can use the following endpoint. You only need to specify the ID of the bill that you want to delete as an argument.

```typescript
await client.bill.delete('62d17d3b377dab6c1342136e')
```

## Bill Institutions

When adding a new bill for a user, we need to provide a reference to the institution who holds the account for the user. As an example, if a user wanted to add their Chase Visa Credit Card to their Spritz account, the Institution of the account would be `Chase Credit Cards` and then the account number provided would be the 16-digit card number for their credit card.

Spritz exposes several endpoints to help users find the Institutions of their bill accounts.

### Fetching popular bill institutions

```typescript
const popularInstitutions = await client.institution.popularUSBillInstitutions()

// Optionally filter by a specific bill type
const popularInstitutions = await client.institution.popularUSBillInstitutions(BillType.Mortgage)
```

### Searching for bill institutions by name

```typescript
const institutions = await client.institution.searchUSBillInstitutions('american express')

// Optionally filter by a specific bill type
const institutions = await client.institution.searchUSBillInstitutions(
  'american express',
  BillType.CreditCard
)
```

## Payment Requests

A payment request refers to the intent to initiate a payment to a specific account. Once a payment request is created, a blockchain transaction is required to fulfill it. After the blockchain transaction settles, the payment request is completed, and a fiat payment is issued to the designated account.

### Create a payment request

To initiate a payment request for a specific account, you can use the following functionality. The required inputs for creating a payment request include the ID of the account to be paid, the amount of the fiat payment in USD, and the network on which the blockchain transaction will settle.

#### Amount Mode

When creating a payment request, you can specify how the amount should be calculated using the `amountMode` parameter:

- **`TOTAL_AMOUNT`**: The payer covers the entire amount including fees. The specified amount is the total that will be deducted from the payer's wallet.
- **`AMOUNT_RECEIVED`** (default): The payment that arrives in the bank account excludes fees. The specified amount is what the recipient will receive, and fees are added on top.

This allows you to control whether fees are included in or added to the specified amount.

```typescript
import {PaymentNetwork, AmountMode} from '@spritz-finance/api-client';

const paymentRequest = await client.paymentRequest.create({
	amount: 100,
	accountId: account.id,
	network: PaymentNetwork.Ethereum,
  deliveryMethod: 'INSTANT',
  amountMode: AmountMode.TOTAL_AMOUNT // Optional, defaults to AMOUNT_RECEIVED
});

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
  createdAt: '2023-05-04T11:40:56.488Z'
}
```

### Fulfil a payment request (EVM transactions)

After creating a payment request, you must issue a blockchain transaction to settle the payment request. For EVM compatible networks, this involves interacting with the SpritzPay smart contract (see: [SpritzPay deployments](https://docs.spritz.finance/docs/deployment-addresses)).

To obtain the data needed for the transaction, you can use the following endpoint.

```typescript
import {PaymentNetwork} from '@spritz-finance/api-client';

const paymentRequest = await client.paymentRequest.create({
	amount: 100,
	accountId: account.id,
	network: PaymentNetwork.Ethereum,
});

const transactionData = await client.paymentRequest.getWeb3PaymentParams({
	paymentRequest,
	paymentTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC on mainnet
})

// Example response

{
  contractAddress: '0xbF7Abc15f00a8C2d6b13A952c58d12b7c194A8D0',
  method: 'payWithToken',
  calldata: '0xd71d9632000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000005f5e100000000000000000000000000000000000000000064539a31c1ac408007b12277',
  value: null,
  requiredTokenInput: '100000000',
  suggestedGasLimit: '110000'
}
```

The contract address (to), calldata (data), and value are the primary components used to execute the blockchain transaction. You can use the `requiredTokenInput` to verify that the user's wallet has sufficient funds to complete the payment before initiating the transaction.

### Fulfil a payment request (Solana transactions)

For Solana payments, you need to obtain a versioned transaction that can be signed and submitted to the Solana network.

```typescript
import {PaymentNetwork} from '@spritz-finance/api-client';

const paymentRequest = await client.paymentRequest.create({
	amount: 100,
	accountId: account.id,
	network: PaymentNetwork.Solana,
});

const transactionData = await client.paymentRequest.getSolanaPaymentParams({
	paymentRequest,
	paymentTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
	signer: 'YourSolanaWalletAddress...',
})

// Example response

{
  versionedTransaction: VersionedTransaction, // Deserialized transaction ready to sign
  transactionSerialized: 'base64EncodedTransaction...' // Base64 encoded transaction
}
```

The `versionedTransaction` is a deserialized Solana transaction that can be signed with your wallet and submitted to the network. The `transactionSerialized` contains the same transaction in base64 encoded format if needed for your implementation.

### Transaction fees

Transaction fees are applied once the monthly transaction volume exceeds $100. To determine the fee amount for a specific payment value, you can use the following endpoint.

```typescript
const fees = await client.paymentRequest.transactionPrice(101)

// Example response
0.01
```

## Payments

Payments represent a fiat payment that has been issued to the account. Once the status of the Payment Request has moved to `Confirmed` then the Payment will be created.

### Transaction Details

Payments now include transaction details about the blockchain transaction that fulfilled the payment. When a payment is completed, the `transaction` field contains:

- **hash**: The blockchain transaction hash
- **from**: The wallet address that sent the payment
- **asset**: The token contract address used for payment
- **value**: The amount transferred (in the token's smallest unit)
- **network**: The blockchain network used (e.g., 'ethereum', 'polygon', etc.)

This allows you to track the on-chain transaction that corresponds to each fiat payment.

### Retrieve a payment by ID

You can fetch a payment directly by its ID:

```typescript
const payment = await client.payment.fetchById('6368e3a3ec516e9572bbd23b');

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
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    from: '0xYourWalletAddress',
    asset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    value: 100000000,
    network: 'ethereum'
  }
}
```

### Retrieve the payment for a payment request

```typescript
import {PaymentNetwork} from '@spritz-finance/api-client';

const paymentRequest = await client.paymentRequest.create({
	amount: 100,
	accountId: account.id,
	network: PaymentNetwork.Ethereum,
});

const payment = await client.payment.getForPaymentRequest(paymentRequest.id);

// Example response

{
  id: '6368e3a3ec516e9572bbd23b',
  userId: '63d12d3B577fab6c6382136e',
  status: 'PENDING',
  accountId: '6322445f10d3f4d19c4d72fe',
  amount: 100,
  feeAmount: null,
  createdAt: '2022-11-07T10:53:23.998Z',
  transaction: null // Will be populated once the payment is fulfilled
}

```

### Retrieve all payments for an account

```typescript
const payments = await client.payment.listForAccount(account.id)

// Example response

[
    {
        id: '6368e3a3ec516e9572bbd23b',
        userId: '63d12d3B577fab6c6382136e',
        status: 'COMPLETED',
        accountId: '6322445f10d3f4d19c4d72fe',
        amount: 100,
        feeAmount: null,
        createdAt: '2022-11-07T10:53:23.998Z',
        transaction: {
            __typename: 'BlockchainTransaction',
            hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            from: '0xYourWalletAddress',
            asset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            value: 100000000,
            network: 'ethereum'
        }
    },
]
```

## Onramp Payments

Onramp Payments are orders to buy crypto stablecoins with a bank transfer. Upon creating an onramp payment, you will receive deposit instructions to fulfill that order. When the bank transfer has been received and disbursed, the status of that onramp payment will change.

### Create onramp payment

```typescript
const onrampPayment = await client.onrampPayment.create({
  token: 'USDC' // Supported: currently only 'USDC'
  network: 'ethereum' // supported: 'ethereum', 'polygon', 'avalanche'
  amount: 100, // How much token to purchase (100 USDC)
  address: '0xbB76483e33e01315438D8F6CF1Aee9C9b85f433b', // Wallet address to disburse tokens to
  paymentMethod: 'ACH' // 'WIRE' or 'ACH'
});

// Example response

{
  "id": "653fab35ad263e5ae8b0e605",
  "amount": 100,
  "feeAmount": 1.5,
  "depositInstructions": {
    "amount": 101.5,
    "currency": "USD",
    "bankName": "Bank of Nowhere",
    "bankAddress": "1800 North Pole St., Orlando, FL 32801",
    "bankBeneficiaryName": "Bridge Ventures Inc",
    "bankRoutingNumber": "123456789",
    "bankAccountNumber": "11223344556677",
    "paymentMethod": "WIRE",
    "depositMessage": "BVI72D90851F051F4189",
  },
  "network": "ethereum",
  "token": "USDC",
  "address": "0xbb76483e33e01315438d8f6cf1aee9c9b85f433b",
  "status": "AWAITING_FUNDS",
  "createdAt": "2023-10-30T13:10:13.521Z",
}


```

### Retrieve all onramp payments for an account

```typescript
const payments =
  await client.onrampPayment.list()[
    // Example response

    {
      id: '653fab35ad263e5ae8b0e605',
      amount: 100,
      feeAmount: 1.5,
      depositInstructions: {
        amount: 101.5,
        currency: 'USD',
        bankName: 'Bank of Nowhere',
        bankAddress: '1800 North Pole St., Orlando, FL 32801',
        bankBeneficiaryName: 'Bridge Ventures Inc',
        bankRoutingNumber: '123456789',
        bankAccountNumber: '11223344556677',
        paymentMethod: 'WIRE',
        depositMessage: 'BVI72D90851F051F4189',
      },
      network: 'ethereum',
      token: 'USDC',
      address: '0xbb76483e33e01315438d8f6cf1aee9c9b85f433b',
      status: 'AWAITING_FUNDS',
      createdAt: '2023-10-30T13:10:13.521Z',
    }
  ]
```

## Webhooks

Instead of making a request to get information, webhooks send information to your specified endpoint as soon as an event occurs. Spritz's integration offers a variety of webhook events that can be crucial for maintaining data integrity and responsiveness in applications. Let's dive into how you can best utilize these.

### Supported webhook events

Spritz currently supports the following webhook events:

#### Account Events

- `account.created`: Triggered when a new account is created.
- `account.updated`: Triggered when details of an account are updated.
- `account.deleted`: Triggered when an account is deleted.

#### Payment Events

- `payment.created`: Triggered when a new payment is initiated.
- `payment.updated`: Triggered when details of a payment are updated.
- `payment.completed`: Triggered when a payment is successfully completed.
- `payment.refunded`: Triggered when a payment is refunded.

#### Verification Events

- `verification.status.updated`: Triggered when a user's verification status changes.

These events allow you to respond to changes in the account and payments for a user.

### Setting up webhooks

To set up a webhook with Spritz, you'll need to provide:

1. **URL**: The endpoint URL where Spritz will send the webhook data.
2. **Events**: The specific events you want to listen for.

```typescript
const webhook = await client.webhook.create({
  url: 'https://my.webhook.url/spritz',
  events: ['account.created', 'account.updated', 'account.deleted'],
})
```

Upon receiving a webhook, your server will get a payload with the following structure:

```json
{
  "userId": "user-id-here",
  "id": "resource-id-here",
  "eventName": "name-of-the-event-here"
}
```

### Managing webhooks

#### List all webhooks

To retrieve all webhooks configured for your integration:

```typescript
const webhooks = await client.webhook.list()
// Returns an array of webhook configurations
```

#### Delete a webhook

To delete a specific webhook by its ID:

```typescript
const deletedWebhook = await client.webhook.delete('webhook-id-here')
// Returns the deleted webhook object
```

### Webhook security and signing

Each webhook request is signed using an HMAC SHA256 signature, based on the exact JSON payload sent in the body. This signature is included in the Signature HTTP header of the request.

The secret key used to compute the signature is the webhook secret you set when configuring your webhook integration. If you have not set a webhook secret, there will be no Signature header in the webhook request.

You can verify webhook authenticity by computing the HMAC signature and comparing it to the Signature header included in the webhook request.

#### Example: Verifying a webhook signature (Node.js)

```typescript
import { createHmac } from "crypto";

const signature = createHmac("sha256", <YOUR_WEBHOOK_SECRET>)
  .update(<REQUEST_BODY_AS_JSON_STRING>) // JSON.stringify(payload)
  .digest("hex");
```

Ensure that the computed signature matches the Signature header received in the webhook request before processing the payload.

### Setting webhook secret

To add or update a webhook secret for signing webhook requests:

```typescript
const result = await client.webhook.updateWebhookSecret('your-webhook-secret-here')
// Returns: { success: true }
```

This secret will be used to sign all subsequent webhook requests sent to your endpoint. Always store your webhook secret securely and never expose it in client-side code.
