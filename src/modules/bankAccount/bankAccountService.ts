import { z } from 'zod'
import {
    CreateBankAccount,
    CreateBankAccountVariables,
} from '../../graph/mutations/__types__/CreateBankAccount'
import {
    DeletePayableAccount,
    DeletePayableAccountVariables,
    DeletePayableAccount_deletePayableAccount_BankAccount,
} from '../../graph/mutations/__types__/DeletePayableAccount'
import {
    RenameBankAccount,
    RenameBankAccountVariables,
    RenameBankAccount_renamePayableAccount_BankAccount,
} from '../../graph/mutations/__types__/RenameBankAccount'
import CreateBankAccountMutation from '../../graph/mutations/createBankAccount.graphql'
import DeletePayableAccountMutation from '../../graph/mutations/deletePayableAccount.graphql'
import RenameBankAccountMutation from '../../graph/mutations/renameBankAccount.graphql'
import type {
    UserBankAccounts_bankAccounts,
    UserBankAccounts_bankAccounts_bankAccountDetails,
    UserBankAccounts_bankAccounts_institution,
} from '../../graph/queries/__types__/UserBankAccounts'
import { SpritzClient } from '../../lib/client'
import type { PathRequestBody, PathResponse } from '../../rest/types'
import {
    BankAccountInput,
    BankAccountSubType,
    BankAccountType,
    PayableAccountType,
} from '../../types/globalTypes'
import { raise } from '../../utils/raise'
import { BankAccountDetailsValidation } from './validation'

export type LinkTokenResponse = PathResponse<'/v1/bank-accounts/link-token', 'post'>
export type CompleteLinkingRequest = PathRequestBody<'/v1/bank-accounts/link-complete', 'post'>

type RestBankAccount = PathResponse<'/v1/bank-accounts/', 'get'>[number]

const REST_TYPE_TO_BANK_ACCOUNT_TYPE: Record<string, BankAccountType> = {
    us: BankAccountType.USBankAccount,
    ca: BankAccountType.CABankAccount,
    uk: BankAccountType.UKBankAccount,
    iban: BankAccountType.IbanAccount,
}

const REST_SUBTYPE_TO_ENUM: Record<string, BankAccountSubType> = {
    checking: BankAccountSubType.Checking,
    savings: BankAccountSubType.Savings,
}

function transformBankAccount(acct: RestBankAccount): UserBankAccounts_bankAccounts {
    const bankAccountType =
        REST_TYPE_TO_BANK_ACCOUNT_TYPE[acct.type] ?? BankAccountType.USBankAccount

    let bankAccountDetails: UserBankAccounts_bankAccounts_bankAccountDetails | null = null
    if (acct.type === 'us' && 'routingNumberLast4' in acct) {
        bankAccountDetails = {
            __typename: 'USBankAccountDetails',
            routingNumber: acct.routingNumberLast4,
        }
    }

    let institution: UserBankAccounts_bankAccounts_institution | null = null
    if (acct.institution) {
        institution = {
            __typename: 'BankAccountInstitution',
            id: '',
            name: acct.institution.name,
            logo: acct.institution.logo ?? null,
            country: '',
            currency: acct.currency,
        }
    }

    const subtype =
        'accountSubtype' in acct && acct.accountSubtype
            ? (REST_SUBTYPE_TO_ENUM[acct.accountSubtype] ?? BankAccountSubType.Checking)
            : BankAccountSubType.Checking

    return {
        __typename: 'BankAccount',
        id: acct.id,
        name: acct.label ?? null,
        userId: '',
        country:
            acct.currency === 'USD'
                ? 'US'
                : acct.currency === 'CAD'
                  ? 'CA'
                  : acct.currency === 'GBP'
                    ? 'GB'
                    : '',
        currency: acct.currency,
        createdAt: acct.createdAt,
        type: PayableAccountType.BankAccount,
        accountNumber: 'accountNumberLast4' in acct ? `****${acct.accountNumberLast4}` : '',
        bankAccountType,
        bankAccountSubType: subtype,
        email: null,
        ownedByUser: true,
        bankAccountDetails,
        deliveryMethods: [],
        institution,
        paymentAddresses: [],
    }
}

type BaseBankAccountInput = Omit<BankAccountInput, 'details' | 'type'>

export type UsBankAccountInput = BaseBankAccountInput & {
    routingNumber: string
}

export type CaBankAccountInput = BaseBankAccountInput & {
    transitNumber: string
    institutionNumber: string
}

export type IbanAccountInput = BaseBankAccountInput

export type UKBankAccountInput = BaseBankAccountInput & {
    sortCode: string
}

type CreateInputMapping = {
    [BankAccountType.USBankAccount]: UsBankAccountInput
    [BankAccountType.CABankAccount]: CaBankAccountInput
    [BankAccountType.IbanAccount]: IbanAccountInput
    [BankAccountType.UKBankAccount]: UKBankAccountInput
}

export class BankAccountService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async list() {
        const accounts = await this.client.restApi<PathResponse<'/v1/bank-accounts/', 'get'>>({
            method: 'get',
            path: '/v1/bank-accounts/',
        })
        return accounts.map(transformBankAccount)
    }

    public async rename(accountId: string, name: string) {
        const response = await this.client.query<RenameBankAccount, RenameBankAccountVariables>({
            query: RenameBankAccountMutation,
            variables: {
                accountId,
                name,
            },
        })
        return (
            (response?.renamePayableAccount as RenameBankAccount_renamePayableAccount_BankAccount) ??
            null
        )
    }

    public async delete(accountId: string) {
        const response = await this.client.query<
            DeletePayableAccount,
            DeletePayableAccountVariables
        >({
            query: DeletePayableAccountMutation,
            variables: {
                accountId,
            },
        })
        return (
            (response?.deletePayableAccount as DeletePayableAccount_deletePayableAccount_BankAccount) ??
            null
        )
    }

    public async createLinkToken() {
        return this.client.restApi<LinkTokenResponse>({
            method: 'post',
            path: '/v1/bank-accounts/link-token',
        })
    }

    public async completeLinking(input: CompleteLinkingRequest) {
        return this.client.restApi<
            PathResponse<'/v1/bank-accounts/link-complete', 'post'>,
            CompleteLinkingRequest
        >({
            method: 'post',
            path: '/v1/bank-accounts/link-complete',
            body: input,
        })
    }

    public async create<T extends BankAccountType>(type: T, input: CreateInputMapping[T]) {
        const validator = BankAccountDetailsValidation[type] ?? raise('Invalid bank account type')

        try {
            const details = validator.parse(input)
            const response = await this.client.query<CreateBankAccount, CreateBankAccountVariables>(
                {
                    query: CreateBankAccountMutation,
                    variables: {
                        createAccountInput: {
                            accountNumber: input.accountNumber,
                            name: input.name ?? null,
                            type,
                            subType: input.subType,
                            details,
                            email: input.email ?? null,
                            ownedByUser: input.ownedByUser ?? null,
                        },
                    },
                }
            )

            return response?.createBankAccount ?? null
        } catch (err) {
            if (err instanceof z.ZodError) {
                throw new Error(err?.issues?.[0]?.message ?? 'Input validation failure')
            }
            throw err
        }
    }
}
