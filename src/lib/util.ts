export const castToError = (err: unknown): Error => {
    if (err instanceof Error) return err

    if (typeof err === 'string') {
        return new Error(err)
    }

    return new Error(String(err))
}

export type Headers = Record<string, string | null | undefined>

export const isRunningInBrowser = () => {
    return (
        typeof globalThis.window !== 'undefined' &&
        typeof globalThis.window.document !== 'undefined' &&
        typeof globalThis.navigator !== 'undefined'
    )
}
