import { AmountMode, PaymentDeliveryMethod } from '../types/globalTypes'

export enum PaymentNetwork {
    Ethereum = 'ethereum',
    Polygon = 'polygon',
    Optimism = 'optimism',
    Arbitrum = 'arbitrum',
    Binance = 'binance-smart-chain',
    Avalanche = 'avalanche',
    Base = 'base',
    Bitcoin = 'bitcoin',
    Dash = 'dash',
    Tron = 'tron',
    Solana = 'solana',
    Sui = 'sui',
}

export interface CreatePaymentRequestInput {
    accountId: string
    amount: number
    network: PaymentNetwork
    deliveryMethod?: PaymentDeliveryMethod | null
    tokenAddress?: string | null
    amountMode?: AmountMode | null
}
