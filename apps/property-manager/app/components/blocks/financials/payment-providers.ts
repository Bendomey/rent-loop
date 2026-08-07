/**
 * How money that has already arrived was handed over.
 *
 * These are the choices offered when a landlord records a payment they have
 * received, so the list is deliberately narrower than the rails a payment
 * account can be set up on. Paystack is excluded: it collects from the tenant
 * online and reports its own payments, so choosing it by hand would mean
 * claiming an online settlement that never went through it.
 */
export const PAYMENT_PROVIDERS: Array<{ value: string; label: string }> = [
	{ value: 'CASH', label: 'Cash' },
	{ value: 'MTN', label: 'MTN MoMo' },
	{ value: 'VODAFONE', label: 'Telecel Cash' },
	{ value: 'AIRTELTIGO', label: 'AT Money' },
	{ value: 'BANK_API', label: 'Bank transfer' },
]
