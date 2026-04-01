import 'dotenv/config'

export function requireEnv(name: string): string {
    const value = process.env[name]
    if (!value) {
        console.error(`Missing required env var: ${name}`)
        console.error('Create a .env file with your sandbox credentials. See .env.example')
        process.exit(1)
    }
    return value
}

export function optionalEnv(name: string): string | undefined {
    return process.env[name] || undefined
}
