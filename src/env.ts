export enum Environment {
    Sandbox = 'sandbox',
    Production = 'production',
}

export type EnvironmentInput = Environment | 'staging'

export function normalizeEnvironment(environment: EnvironmentInput): Environment {
    return environment === 'staging' ? Environment.Sandbox : environment
}
