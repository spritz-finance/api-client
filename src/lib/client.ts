import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { DocumentNode, print } from 'graphql'
import { OperationDefinitionNode } from 'graphql/language/ast'
import { config } from '../config'
import { Environment } from '../env'

interface QueryParams<V = any> {
    query: DocumentNode
    variables?: V
}

class SpritzApiError extends Error {
    date: Date

    constructor(message: string, ...params: any[]) {
        super(...params)

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SpritzApiError)
        }

        this.name = 'SpritzApiError'
        this.message = message
        this.date = new Date()
    }
}

export const createGraphClient = (config: AxiosRequestConfig) => {
    const serviceClient = axios.create(config)
    return serviceClient
}

export class GraphClient {
    client: AxiosInstance

    constructor(environment: Environment, apiKey: string, integrationKey?: string) {
        this.client = createGraphClient({
            baseURL: config[environment].graphEndpoint,
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + apiKey,
                ...(integrationKey ? { 'X-INTEGRATION-KEY': integrationKey } : {}),
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
                throw new SpritzApiError(`Spritz GraphQL Error: ${response.data.errors[0].message}`)
            }
            return response.data.data as Q
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data.Message ?? error.response?.data.message
                throw new SpritzApiError(`Spritz Request Error: ${message}`)
            } else {
                throw new SpritzApiError(`Spritz Request Error: ${error.message}`)
            }
        }
    }
}
