import { VersionedTransaction } from '@solana/web3.js'
import {
    CreatePaymentRequest,
    CreatePaymentRequestVariables,
    CreatePaymentRequest_createDirectPayment,
} from '../../graph/mutations/__types__/CreatePaymentRequest'
import CreatePaymentRequestMutation from '../../graph/mutations/createPaymentRequest.graphql'
import {
    GetSolanaPayParams,
    GetSolanaPayParamsVariables,
    GetSpritzPayParams,
    GetSpritzPayParamsVariables,
} from '../../graph/queries/__types__'
import SolanaPayParamsQuery from '../../graph/queries/solanaPayParams.graphql'
import SpritzPayParamsQuery from '../../graph/queries/spritzPayParams.graphql'
import { SpritzClient } from '../../lib/client'
import { isValidEthereumAddress, isValidSolanaAddress } from '../../utils/address'
import { roundCurrency } from '../../utils/roundCurrency'
import { CreatePaymentRequestInput } from '../types'

function base64ToBuffer(base64String: string) {
    const cleanData = base64String.replace(/^data:\w+\/\w+;base64,/, '')
    const buffer = Buffer.from(cleanData, 'base64')
    const bytes = new Uint8Array(buffer)
    return bytes
}

type PaymentRequest = CreatePaymentRequest_createDirectPayment

export class PaymentRequestService {
    private client: SpritzClient

    constructor(client: SpritzClient) {
        this.client = client
    }

    public async create(input: CreatePaymentRequestInput) {
        const response = await this.client.query<
            CreatePaymentRequest,
            CreatePaymentRequestVariables
        >({
            query: CreatePaymentRequestMutation,
            variables: {
                createDirectPaymentInput: {
                    ...input,
                    amount: input.amount,
                },
            },
        })

        return response?.createDirectPayment
    }

    // public async transactionPrice(paymentAmount: number) {
    //     const response = await this.client.query<TransactionPrice, TransactionPriceVariables>({
    //         query: CreatePaymentRequestMutation,
    //         variables: {
    //             amount: roundCurrency(paymentAmount),
    //         },
    //     })

    //     return response?.transactionPrice ?? 0
    // }

    public async getWeb3PaymentParams(input: {
        paymentRequest: PaymentRequest
        paymentTokenAddress: string
    }) {
        const validTokenAddress = isValidEthereumAddress(input.paymentTokenAddress)
        if (!validTokenAddress) throw new Error('Invalid token address')

        const response = await this.client.query<GetSpritzPayParams, GetSpritzPayParamsVariables>({
            query: SpritzPayParamsQuery,
            variables: {
                amount: roundCurrency(input.paymentRequest.amountDue),
                network: input.paymentRequest.network,
                tokenAddress: input.paymentTokenAddress,
                reference: input.paymentRequest.id,
            },
        })

        return response?.spritzPayParams
    }
    public async getSolanaPaymentParams(input: {
        paymentRequest: PaymentRequest
        paymentTokenAddress: string
        signer: string
    }) {
        const validTokenAddress = isValidSolanaAddress(input.paymentTokenAddress)
        if (!validTokenAddress)
            throw new Error(`Invalid token address: ${input.paymentTokenAddress}`)
        const validSigner = isValidSolanaAddress(input.signer)
        if (!validSigner) throw new Error(`Invalid signer: ${input.signer}`)

        const response = await this.client.query<GetSolanaPayParams, GetSolanaPayParamsVariables>({
            query: SolanaPayParamsQuery,
            variables: {
                amount: roundCurrency(input.paymentRequest.amountDue),
                tokenAddress: input.paymentTokenAddress,
                reference: input.paymentRequest.id,
                signer: input.signer,
            },
        })

        return {
            versionedTransaction: VersionedTransaction.deserialize(
                base64ToBuffer(response?.solanaParams?.transactionSerialized ?? '')
            ),
            transactionSerialized: response?.solanaParams?.transactionSerialized,
        }
    }
}
