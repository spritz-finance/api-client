export const gracefulParseJSON = (text: string) => {
    try {
        return JSON.parse(text)
    } catch (err) {
        return undefined
    }
}
