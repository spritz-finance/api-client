import { graphql, HttpResponse } from 'msw'

export const graphqlHandlers = [
    // Current User Query
    graphql.query('CurrentUser', () => {
        return HttpResponse.json({
            data: {
                me: {
                    id: 'user-123',
                    email: 'test@example.com',
                    sub: 'user-123',
                    firstName: 'Test',
                    lastName: 'User',
                    picture: null,
                    phone: null,
                    createdAt: '2023-01-01T00:00:00Z',
                    timezone: 'UTC',
                },
            },
        })
    }),

    // User Bank Accounts Query
    graphql.query('UserBankAccounts', () => {
        return HttpResponse.json({
            data: {
                userBankAccounts: [
                    {
                        id: 'bank-account-123',
                        name: 'Test Bank Account',
                        userId: 'user-123',
                        type: 'BankAccount',
                    },
                ],
            },
        })
    }),

    // Create Payment Request Mutation
    graphql.mutation('CreatePaymentRequest', () => {
        return HttpResponse.json({
            data: {
                createDirectPayment: {
                    id: 'payment-request-123',
                    userId: 'user-123',
                    accountId: 'bank-account-123',
                    status: 'CREATED',
                    amount: 100,
                    feeAmount: 1,
                    network: 'ethereum',
                },
            },
        })
    }),

    // Get Payment for Payment Request Query
    graphql.query('PaymentRequestPayment', () => {
        return HttpResponse.json({
            data: {
                paymentForPaymentRequest: {
                    id: 'payment-123',
                    userId: 'user-123',
                    accountId: 'bank-account-123',
                    status: 'COMPLETED',
                    amount: 100,
                    feeAmount: 1,
                    createdAt: '2023-01-01T00:00:00Z',
                    deliveryMethod: 'STANDARD',
                    paymentRequestId: 'payment-request-123',
                    targetCurrency: 'USD',
                    targetCurrencyAmount: 100,
                    targetCurrencyRate: 1,
                },
            },
        })
    }),

    // Get Spritz Pay Params Query
    graphql.query('GetSpritzPayParams', () => {
        return HttpResponse.json({
            data: {
                spritzPayParams: {
                    contractAddress: '0xbF7Abc15f00a8C2d6b13A952c58d12b7c194A8D0',
                    method: 'payWithToken',
                    calldata:
                        '0xd71d9632000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000005f5e100',
                    value: null,
                    requiredTokenInput: '100000000',
                },
            },
        })
    }),

    // User Debit Cards Query
    graphql.query('UserDebitCards', () => {
        return HttpResponse.json({
            data: {
                debitCards: [
                    {
                        id: 'debit-card-123',
                        type: 'DebitCard',
                        name: 'Test Visa Card',
                        userId: 'user-123',
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
                    {
                        id: 'debit-card-456',
                        type: 'DebitCard',
                        name: 'Test Mastercard',
                        userId: 'user-123',
                        country: 'US',
                        currency: 'USD',
                        payable: true,
                        debitCardNetwork: 'Mastercard',
                        expirationDate: '06/26',
                        cardNumber: '5555555555554444',
                        mask: '4444',
                        createdAt: '2023-01-02T00:00:00Z',
                        paymentCount: 3,
                        externalId: 'ext-456',
                    },
                ],
            },
        })
    }),

    // Create Debit Card Mutation
    graphql.mutation('CreateDebitCard', () => {
        return HttpResponse.json({
            data: {
                createDebitCard: {
                    id: 'debit-card-789',
                    type: 'DebitCard',
                    name: 'Test Debit Card',
                    userId: 'user-123',
                    country: 'US',
                    currency: 'USD',
                    payable: true,
                    debitCardNetwork: 'Visa',
                    expirationDate: '12/25',
                    cardNumber: '4111111111111111',
                    mask: '1111',
                    createdAt: '2023-01-03T00:00:00Z',
                    paymentCount: 0,
                    externalId: 'ext-789',
                },
            },
        })
    }),

    // Rename Debit Card Mutation
    graphql.mutation('RenameDebitCard', () => {
        return HttpResponse.json({
            data: {
                renamePayableAccount: {
                    __typename: 'DebitCard',
                    id: 'debit-card-123',
                    type: 'DebitCard',
                    name: 'Updated Card Name',
                    userId: 'user-123',
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
            },
        })
    }),

    // Delete Payable Account Mutation (handles debit cards too)
    graphql.mutation('DeletePayableAccount', ({ variables }) => {
        if (variables.accountId === 'debit-card-123') {
            return HttpResponse.json({
                data: {
                    deletePayableAccount: {
                        __typename: 'DebitCard',
                        id: 'debit-card-123',
                        type: 'DebitCard',
                        name: 'Test Visa Card',
                        userId: 'user-123',
                        country: 'US',
                        currency: 'USD',
                        payable: false,
                        debitCardNetwork: 'Visa',
                        expirationDate: '12/25',
                        cardNumber: '4111111111111111',
                        mask: '1111',
                        createdAt: '2023-01-01T00:00:00Z',
                        paymentCount: 5,
                        externalId: 'ext-123',
                    },
                },
            })
        }
        return HttpResponse.json({
            data: { deletePayableAccount: null },
        })
    }),

    // Default fallback for unhandled GraphQL operations
    graphql.operation(() => {
        return HttpResponse.json({
            errors: [
                {
                    message: 'Unhandled GraphQL operation in test mock',
                },
            ],
        })
    }),
]
