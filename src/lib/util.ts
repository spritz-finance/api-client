export const castToError = (err: any): Error => {
    if (err instanceof Error) return err
    return new Error(err)
}

export type Headers = Record<string, string | null | undefined>

export const isRunningInBrowser = () => {
    return (
        // @ts-ignore
        typeof window !== 'undefined' &&
        // @ts-ignore
        typeof window.document !== 'undefined' &&
        // @ts-ignore
        typeof navigator !== 'undefined'
    )
}
