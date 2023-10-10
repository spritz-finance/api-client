import { Environment } from './env'

type Config = {
    baseEndpoint: string
    graphEndpoint: string
}

type ApiConfig = Record<Environment, Config>

export const config: ApiConfig = {
    staging: {
        baseEndpoint: 'https://api-staging.spritz.finance',
        graphEndpoint: 'https://api-staging.spritz.finance/router/graph',
    },
    production: {
        baseEndpoint: 'https://api.spritz.finance',
        graphEndpoint: 'https://api.spritz.finance/router/graph',
    },
}
