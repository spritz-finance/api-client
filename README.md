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

## Table of contents

- [Interacting with the Spritz API](#interacting-with-the-spritz-api)
  - [Creating a user](#creating-a-user)
  - [Capabilities of the API Key:](#capabilities-of-the-api-key-)
- [Usage](#usage)
- [Creating a user](#creating-a-user-1)
  - [Setting the User API Key](#setting-the-user-api-key)
- [Basic User Data](#basic-user-data)
- [User Verification](#user-verification)
  - [Overview](#overview)
  - [Process](#process)
  - [How to Present Verification Flow to the User](#how-to-present-verification-flow-to-the-user)
- [Basic payment flow](#basic-payment-flow)
  - [Note on Issuing the Blockchain Transaction](#note-on-issuing-the-blockchain-transaction)
  - [Example](#example)
- [Accounts](#accounts)
  - [Account Types](#account-types)
  - [Commonalities & Differences](#commonalities---differences)
  - [Bank Accounts](#bank-accounts)
    - [List user bank accounts](#list-user-bank-accounts)
    - [Add US bank account](#add-us-bank-account)
  - [Bills](#bills)
    - [List user bills](#list-user-bills)
    - [Add US bill account](#add-us-bill-account)
  - [Virtual Card](#virtual-card)
    - [Fetch a users virtual card](#fetch-a-users-virtual-card)
    - [Create a US virtual debit card](#create-a-us-virtual-debit-card)
    - [Displaying sensitive card details](#displaying-sensitive-card-details)
- [Renaming accounts](#renaming-accounts)
  - [Rename a bank account](#rename-a-bank-account)
  - [Rename a bill](#rename-a-bill)
- [Deleting accounts](#deleting-accounts)
  - [Delete a bank account](#delete-a-bank-account)
  - [Delete a bill](#delete-a-bill)
- [Bill Institutions](#bill-institutions)
  - [Fetching popular bill institutions](#fetching-popular-bill-institutions)
  - [Searching for bill institutions by name](#searching-for-bill-institutions-by-name)
- [Payment Requests](#payment-requests)
  - [Create a payment request](#create-a-payment-request)
  - [Fulfil a payment request (EVM transactions)](#fulfil-a-payment-request--evm-transactions-)
  - [Transaction fees](#transaction-fees)
- [Payments](#payments)
  - [Retrieve the payment for a payment request](#retrieve-the-payment-for-a-payment-request)
  - [Retrieve all payments for an account](#retrieve-all-payments-for-an-account)
- [Webhooks](#webhooks)
  - [Supported webhook events](#supported-webhook-events)
    - [Account Events](#account-events)
    - [Payment Events](#payment-events)
  - [Setting up webhooks](#setting-up-webhooks)

## Interacting with the Spritz API

**Purpose**: As an integrator, this guide will assist you in creating users and performing user-specific operations on the Spritz platform using the provided API key.

### Creating a user

When you create a user using your integration key:

- You will receive an `API key` specific to that user.
- This enables you to interact with the Spritz platform on the user's behalf.

### Capabilities of the API Key:

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
  environment: Environment.Staging,
  apiKey: 'YOUR_USER_API_KEY_HERE',
  integrationKey: 'YOUR_INTEGRATION_KEY_HERE',
})
```

## Creating a user

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

## Basic User Data

Use this to fetch the user's basic data

```typescript
const userData = await client.user.getCurrentUser()
```

## User Verification

**Purpose**: To ensure users are properly identified before interacting with the Spritz platform.

### Overview

All users must undergo basic identity verification before they can engage with the Spritz platform's features.

### Process

1. **User Creation**: Upon the creation of a new user, their default verification status will be set to `INITIALIZED`.

2. **Checking Verification Status**: Use the `getUserVerification` method to retrieve the current verification status of a user.
3. **Verification Transition**: Once a user completes the identity verification process, their status will change from `INITIALIZED` to `ACTIVE`. Only then can the user fully interact with the platform.

4. **Getting Verification URL**: When you request a user's verification status, the response will provide a `verificationUrl`. This URL is essential for the user to proceed with their identity verification.

### How to Present Verification Flow to the User

Here are some options on how you can present the `verificationUrl` to the user:

- **Browser**: Open the URL in a new browser tab.
- **In-App**: Embed the URL in an iframe within your application.
- **Mobile**: If your platform is mobile-based, open the URL in a native mobile web view.
- **Email**: Send users an email containing the link, prompting them to complete the identity verification.

```typescript
const verificationData = await client.user.getUserVerification()
```

## Basic payment flow

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

Spritz supports three distinct types of accounts:

1. **Bank Account**
2. **Bill**
3. **Virtual Card**

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
  holder: "Bilbo Baggins",
  institution: {
    id: "62d27d4b277dab3c1342126e",
    name: "Shire Bank",
	logo: "https://tinyurl.com/shire-bank-logo",
  },
  ownedByUser: true,
  createdAt: "2023-05-03T11:25:02.401Z",
}]
```

#### Add US bank account

Currently, Spritz supports the addition of US bank accounts:

The input structure for adding a US bank account is defined as:

```typescript
// Input arguments for creating a US bank account
export interface USBankAccountInput {
  accountNumber: string
  email: string
  holder: string
  name: string
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
  email: 'bilbo@shiremail.net',
  holder: 'Bilbo Baggins',
  name: 'Precious Savings',
  ownedByUser: true,
  subType: BankAccountSubType.Savings,
})
```

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

## Renaming accounts

### Rename a bank account

You can conveniently change the display name of a bank account using the following endpoint. The first argument specifies the ID of the bank account, while the second argument represents the desired new name for the account.

```typescript
const updateAccount = await client.bankAccount.rename('62d17d3b377dab6c1342136e', 'My new account')
```

### Rename a bill

You can conveniently change the display name of a bill using the following endpoint. The first argument specifies the ID of the bill, while the second argument represents the desired new name for the account.

```typescript
const updateAccount = await client.bill.rename('62d17d3b377dab6c1342136e', 'My first credit card')
```

## Deleting accounts

### Delete a bank account

To remove a bank account from a user's account, you can use the following endpoint. You only need to specify the ID of the bank account that you want to delete as an argument.

```typescript
await client.bankAccount.delete('62d17d3b377dab6c1342136e')
```

### Delete a bill

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

```typescript
import {PaymentNetwork} from '@spritz-finance/api-client';

const paymentRequest = await client.paymentRequest.create({
	amount: 100,
	accountId: account.id,
	network: PaymentNetwork.Ethereum,
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

### Transaction fees

Transaction fees are applied once the monthly transaction volume exceeds $100. To determine the fee amount for a specific payment value, you can use the following endpoint.

```typescript
const fees = await client.paymentRequest.transactionPrice(101)

// Example response
0.01
```

## Payments

Payments represent a fiat payment that has been issued to the account. Once the status of the Payment Request has moved to `Confirmed` then the Payment will be created.

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
  createdAt: '2022-11-07T10:53:23.998Z'
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
        status: 'PENDING',
        accountId: '6322445f10d3f4d19c4d72fe',
        amount: 100,
        feeAmount: null,
        createdAt: '2022-11-07T10:53:23.998Z',
    },
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
