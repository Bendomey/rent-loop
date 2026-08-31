export type ReleaseHighlight = {
	icon: 'doc' | 'clock' | 'calendar' | 'alert'
	title: string
	body: string
}

export type Release = {
	id: string
	/** ISO date (YYYY-MM-DD) the change shipped. */
	date: string
	title: string
	summary?: string
	highlights?: ReleaseHighlight[]
	bullets?: string[]
	/** Where the feature lives in the portal. */
	where?: string
	cta?: string
	/** Small grouped changes never count as "new to you" or headline a modal. */
	minor?: boolean
}

export const RELEASES: Release[] = [
	{
		id: 'lease-change-history',
		date: '2026-08-24',
		title: 'You can see everything that has changed on a lease',
		summary:
			'Every rent rise, room move and early ending is written down with the day you made the change and the day it starts — so you never have to remember what a tenant’s terms used to be.',
		highlights: [
			{
				icon: 'doc',
				title: 'What it was, and what it is now',
				body: 'Each change shows the old figure beside the new one, so GH₵ 900.00 → GH₵ 950.00 is one line, not two screens.',
			},
			{
				icon: 'clock',
				title: 'It tells you what has not happened yet',
				body: 'A rent rise you entered today but that starts next month sits at the top, marked “has not happened yet”.',
			},
		],
		where: 'Occupancy › Rental Agreements › open a lease › What’s changed',
		cta: 'Show me on a lease',
	},
	{
		id: 'hold-room-dates',
		date: '2026-08-11',
		title: 'You can hold a room so nobody books it',
		summary:
			'Keeping a room back for repairs or for family now takes the nights off the market, and tells you what those nights were worth before you commit.',
		highlights: [
			{
				icon: 'calendar',
				title: 'It says how many nights it costs you',
				body: 'Before you hold anything: “that is 4 nights off the market — GH₵ 2,000.00 you will not take in bookings”.',
			},
			{
				icon: 'alert',
				title: 'It stops you double-booking',
				body: 'If someone already has those nights, it names them and will not let the hold through.',
			},
		],
		where: 'Assets › Apartments/Units › open a room › Is it free?',
		cta: 'Show me a room',
	},
	{
		id: 'bills-look-like-bills',
		date: '2026-08-02',
		title: 'Bills look like bills',
		summary:
			'A bill now reads as one sheet you could hand to someone — who owes what, by when — instead of a table split over tabs.',
		where: 'Financials › Invoice Payments › open a bill',
		cta: 'Open a bill',
	},
	{
		id: 'small-things-july',
		date: '2026-07-21',
		title: 'Small things',
		minor: true,
		bullets: [
			'Dates are written out in full everywhere — 1 September 2026, not 01/09/26.',
			'Money owed on a lease no longer waits until the next morning to show.',
			'The tenant’s phone number is a tap away on their lease.',
		],
	},
	{
		id: 'renew-lease-four-questions',
		date: '2026-06-30',
		title: 'Renewing a lease is four questions',
		summary:
			'Renewals used to be a form. They are now four questions with the answer stated at the end — how long, what rent, when it starts, and what that adds up to in rent payments.',
		where: 'Occupancy › Rental Agreements › open a lease › Renew',
		cta: 'See how it works',
	},
	{
		id: 'the-birth-of-rentloop',
		date: '2026-06-01',
		title: 'The birth of Rentloop',
		summary:
			'Rentloop is born out of a desire to simplify property management for landlords and tenants alike — a rental experience that is hassle-free, transparent, and efficient for everyone involved.',
		bullets: [
			'Properties, units and apartments management',
			'Online rent payments',
			'Maintenance request tracking',
			'Tenant screening',
			'Lease management',
			'Communication tools',
		],
	},
]

/** The oldest month we keep entries for. */
export const CHANGELOG_SINCE = 'June 2026'
