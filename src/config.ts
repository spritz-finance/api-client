import { Environment } from './env'

type Config = {
    graphEndpoint: string
}

type ApiConfig = Record<Environment, Config>

export const config: ApiConfig = {
    staging: {
        graphEndpoint: 'https://api-staging.spritz.finance/graphql',
    },
    production: {
        graphEndpoint: 'https://api.spritz.finance/graphql',
    },
}
