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

const client = SpritzApiClient.initialize(Environment.Staging, 'YOUR_API_KEY_HERE')
```

## Bank Accounts

### List user bank accounts

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

```typescript
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

```typescript
const updateAccount = await client.bankAccounts.rename('62d17d3b377dab6c1342136e', 'My new account')
```

### Delete a bank account

```typescript
await client.bankAccounts.delete('62d17d3b377dab6c1342136e')
```
