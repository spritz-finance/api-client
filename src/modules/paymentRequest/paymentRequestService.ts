import {
    CreatePaymentRequest,
    CreatePaymentRequestVariables,
} from '../../graph/mutations/__types__/CreatePaymentRequest'
import CreatePaymentRequestMutation from '../../graph/mutations/createPaymentRequest.graphql'
import SpritzPayParamsQuery from '../../graph/queries/spritzPayParams.graphql'
import {
    GetSpritzPayParams,
    GetSpritzPayParamsVariables,
    GetSpritzPayParams_spritzPayParams,
} from '../../graph/queries/__types__'
import { GraphClient } from '../../lib/client'
import { AccountProvider } from '../../types/globalTypes'
import { CreatePaymentRequestInput, PaymentNetwork } from '../types'
import { roundCurrency } from '../../utils/roundCurrency'
import { isValidEthereumAddress } from '../../utils/address'

type Web3PaymentParams = GetSpritzPayParams_spritzPayParams

export class PaymentRequestService {
    private client: GraphClient

    constructor(client: GraphClient) {
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
                    provider: AccountProvider.CHECKBOOK,
                },
            },
        })

        return response?.createDirectPayment
    }

    /**
     * Retrieves the Web3 payment parameters for a specified payment request.
     *
     * @async
     * @param {Object} input - The input object containing payment request details.
     * @param {string} input.paymentRequestId - The unique identifier for the payment request.
     * @param {number} input.amount - The amount to be paid in the transaction, decimals in USD (eg. 12.45)
     * @param {PaymentNetwork} input.network - The Ethereum network to be used for the transaction
     * @param {string} input.paymentTokenAddress - The Ethereum address of the ERC20 token used for payment.
     * If set to true, the function will throw an error if the checksum is invalid. Default is false.
     * @returns {Promise<Web3PaymentParams>} A Promise that resolves to an object containing the Web3 payment parameters.
     * @throws {Error} If the paymentTokenAddress is an invalid ethereum address.
     */
    public async getWeb3PaymentParams(input: {
        paymentRequestId: string
        amount: number
        network: PaymentNetwork
        paymentTokenAddress: string
    }): Promise<Web3PaymentParams> {
        const validTokenAddress = isValidEthereumAddress(input.paymentTokenAddress)
        if (!validTokenAddress) throw new Error('Invalid token address')

        const response = await this.client.query<GetSpritzPayParams, GetSpritzPayParamsVariables>({
            query: SpritzPayParamsQuery,
            variables: {
                amount: roundCurrency(input.amount),
                network: input.network,
                tokenAddress: input.paymentTokenAddress,
                reference: input.paymentRequestId,
            },
        })

        return response?.spritzPayParams
    }
}