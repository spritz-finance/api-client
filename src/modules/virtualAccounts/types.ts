import { PaymentNetwork } from '../types'

export const supportedTokenMatrix: Partial<Record<PaymentNetwork, string[]>> = {
    [PaymentNetwork.Ethereum]: ['USDC', 'USDT', 'DAI', 'USDP', 'PYUSD'],
    [PaymentNetwork.Polygon]: ['USDC'],
    [PaymentNetwork.Base]: ['USDC'],
    [PaymentNetwork.Arbitrum]: ['USDC'],
    [PaymentNetwork.Avalanche]: ['USDC'],
    [PaymentNetwork.Optimism]: ['USDC'],
    [PaymentNetwork.Solana]: ['USDC', 'PYUSD'],
    [PaymentNetwork.Tron]: ['USDT'],
}

export interface CreateVirtualAccountInput {
    network: PaymentNetwork
    address: string
    token: string
}

export function validateCreateVirtualAccountInput(input: CreateVirtualAccountInput): void {
    const { network, token } = input
    const supportedTokens = supportedTokenMatrix[network]

    if (!supportedTokens || !supportedTokens.includes(token)) {
        throw new Error(
            `Token "${token}" is not supported on network "${network}". ` +
                `Supported tokens for ${network}: ${supportedTokens?.join(', ') || 'none'}`
        )
    }
}
