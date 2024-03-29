import {
    CreatePaymentRequest,
    CreatePaymentRequestVariables,
    CreatePaymentRequest_createDirectPayment,
} from '../../graph/mutations/__types__/CreatePaymentRequest'
import CreatePaymentRequestMutation from '../../graph/mutations/createPaymentRequest.graphql'
import {
    GetSpritzPayParams,
    GetSpritzPayParamsVariables,
    TransactionPrice,
    TransactionPriceVariables,
} from '../../graph/queries/__types__'
import SpritzPayParamsQuery from '../../graph/queries/spritzPayParams.graphql'
import { SpritzClient } from '../../lib/client'
import { isValidEthereumAddress } from '../../utils/address'
import { roundCurrency } from '../../utils/roundCurrency'
import { CreatePaymentRequestInput } from '../types'

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
                    amount: roundCurrency(input.amount),
                },
            },
        })

        return response?.createDirectPayment
    }

    public async transactionPrice(paymentAmount: number) {
        const response = await this.client.query<TransactionPrice, TransactionPriceVariables>({
            query: CreatePaymentRequestMutation,
            variables: {
                amount: roundCurrency(paymentAmount),
            },
        })

        return response?.transactionPrice ?? 0
    }

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
}
