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

## Usage

```typescript
import { SpritzApiClient, Environment } from '@spritz-finance/api-client'

const client = SpritzApiClient.initialize({
	environment: Environment.Staging, 
	apiKey: 'YOUR_API_KEY_HERE'
})
```

## Bank Accounts

Spritz provides robust support for bank accounts, allowing you to easily manage and interact with a user's bank account. To leverage these capabilities, you can utilize our specific methods and functionalities designed for bank accounts.

### List user bank accounts

You can retrieve a comprehensive list of all bank accounts that have been linked to a user's account using this functionality.

```typescript
const bankAccounts = await client.bankAccounts.list()
```

#### Example response

The bank accounts endpoint returns a standard response comprising an array of all the user-added bank accounts that are available for making payments. This array provides all the necessary information to both display the account details in a user interface and process payments to the respective accounts.

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
}];
```

### Add US bank account

At present, you can only add US bank accounts to a user's account. To add a US bank account for the user, you can use the following.

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

const bankAccounts = await client.bankAccounts.create(BankAccountType.USBankAccount, {
    accountNumber: '123456789',
    routingNumber: '987654321',
    email: 'bilbo@shiremail.net',
    holder: 'Bilbo Baggins',
    name: 'Precious Savings',
    ownedByUser: true,
    subType: BankAccountSubType.Savings,
})
```

### Rename a bank account

You can conveniently change the display name of a bank account using the following endpoint. The first argument specifies the ID of the bank account, while the second argument represents the desired new name for the account.

```typescript
const updateAccount = await client.bankAccounts.rename('62d17d3b377dab6c1342136e', 'My new account')
```

### Delete a bank account

To remove a bank account from a user's account, you can use the following endpoint. You only need to specify the ID of the bank account that you want to delete as an argument.

```typescript
await client.bankAccounts.delete('62d17d3b377dab6c1342136e')
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
