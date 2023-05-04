export const roundCurrency = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100
