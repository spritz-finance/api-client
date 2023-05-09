import { Environment } from './env'

type Config = {
    baseEndpoint: string
    graphEndpoint: string
}

type ApiConfig = Record<Environment, Config>

export const config: ApiConfig = {
    staging: {
        baseEndpoint: 'https://api-staging.spritz.finance',
        graphEndpoint: 'https://api-staging.spritz.finance/graphql',
    },
    production: {
        baseEndpoint: 'https://api.spritz.finance',
        graphEndpoint: 'https://api.spritz.finance/graphql',
    },
}
