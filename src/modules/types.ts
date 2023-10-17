import { PaymentDeliveryMethod } from '../types/globalTypes'

export enum PaymentNetwork {
    Ethereum = 'ethereum',
    Polygon = 'polygon',
    Optimism = 'optimism',
    Arbitrum = 'arbitrum',
    Binance = 'binance-smart-chain',
    Avalanche = 'avalanche',
    Bitcoin = 'bitcoin',
    BitcoinTestnet = 'bitcoin-testnet',
    Dash = 'dash',
    DashTestnet = 'dash-testnet',
}

export interface CreatePaymentRequestInput {
    accountId: string
    amount: number
    network: PaymentNetwork
    deliveryMethod?: PaymentDeliveryMethod | null
}
