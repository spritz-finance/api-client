import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { DocumentNode, print } from 'graphql'
import { OperationDefinitionNode } from 'graphql/language/ast'
import { config } from '../config'
import { Environment } from '../env'

interface QueryParams<V = any> {
    query: DocumentNode
    variables?: V
}

export const createGraphClient = (config: AxiosRequestConfig) => {
    const serviceClient = axios.create(config)
    return serviceClient
}

export class GraphClient {
    client: AxiosInstance

    constructor(environment: Environment) {
        this.client = createGraphClient({
            baseURL: config[environment].graphEndpoint,
            headers: {
                'Content-Type': 'application/json',
            },
        })
    }

    async query<Q = any, V = any>({ query, variables }: QueryParams<V>) {
        try {
            const response = await this.client.post<{ data: Q; errors?: any }>('', {
                query: print(query),
                variables,
                operationName: (query?.definitions?.[0] as OperationDefinitionNode)?.name?.value,
            })
            if (response.data.errors) {
                throw new Error(`Spritz GraphQL Error: ${JSON.stringify(response.data.errors)}`)
            }
            return response.data.data as Q
        } catch (error: any) {
            throw new Error(`Spritz Request Error: ${error.message}`)
        }
    }
}
