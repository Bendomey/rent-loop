const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string }> = {
	GHS: { symbol: 'GH₵', locale: 'en-GH' },
	USD: { symbol: '$', locale: 'en-US' },
	EUR: { symbol: '€', locale: 'en-EU' },
	GBP: { symbol: '£', locale: 'en-GB' },
	NGN: { symbol: '₦', locale: 'en-NG' },
	KES: { symbol: 'KSh', locale: 'en-KE' },
	ZAR: { symbol: 'R', locale: 'en-ZA' },
	XOF: { symbol: 'CFA', locale: 'fr-SN' },
	XAF: { symbol: 'FCFA', locale: 'fr-CM' },
}

const getConfig = (currency: string) =>
	(CURRENCY_CONFIG[currency.toUpperCase()] ?? CURRENCY_CONFIG['GHS'])!

export const formatAmount = (amount: number, currency = 'GHS'): string => {
	const { symbol, locale } = getConfig(currency)
	const formatted = amount.toLocaleString(locale, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})
	return `${symbol} ${formatted}`
}

/**
 * Short form for headline figures on cards — "GH₵ 950", "GH₵ 17.5K",
 * "GH₵ 3.4M". Small values are left intact; larger ones are abbreviated so the
 * number never has to wrap or truncate. Pair with a title/tooltip carrying the
 * exact amount from `formatAmount`.
 */
export const formatAmountCompact = (
	amount: number,
	currency = 'GHS',
): string => {
	const { symbol, locale } = getConfig(currency)
	const formatted = amount.toLocaleString(locale, {
		notation: 'compact',
		maximumFractionDigits: 1,
	})
	return `${symbol} ${formatted}`
}

export const formatAmountWithoutCurrency = (
	amount: number,
	currency = 'GHS',
): string => {
	const { locale } = getConfig(currency)
	return amount.toLocaleString(locale, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})
}

export const convertPesewasToCedis = (amount: number): number => {
	return amount / 100
}

export const convertCedisToPesewas = (amount: number): number => {
	return Math.round(amount * 100)
}
