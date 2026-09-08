import { APP_NAME } from './constants'
import { plans } from './plans'
import { safeString } from './strings'
import { capitalize } from './utils'

const MAX_LENGTH_META_DESCRIPTION = 200

const coreKeywords = [
	'property management software',
	'property management software Ghana',
	'rental management software Ghana',
	'landlord software Ghana',
	'property management Accra',
	'rent collection Ghana',
	'estate management software Ghana',
	'real estate software West Africa',
	'property management software Africa',
	'property management',
	'rental management',
	'tenant management',
	'lease management',
	'maintenance tracking',
	'rent collection',
	'landlord tools',
	'property manager software',
	'rental property software',
]

export const pageKeywords = {
	home: [
		'property management software Ghana',
		'rental management software Ghana',
		'landlord app Ghana',
		'property management Accra',
		'property manager Kumasi',
		'rental management Tema',
		'mobile money rent payment',
		'collect rent in cedis',
		'multi-property management',
		'rental income tracking',
		'property management dashboard',
		'Buildium alternative',
		'AppFolio alternative',
	],
	pricing: [
		'property management software pricing',
		'free property management software',
		'affordable property management software',
		'property management software for small landlords',
		'rental software for 10 units',
		'property management software free trial',
		'property management software Ghana pricing',
		'hostel management software Ghana pricing',
	],
	managers: [
		'property management software for landlords',
		'landlord software Ghana',
		'caretaker management app',
		'rent advance management',
		'two year rent advance',
		'tenancy agreement Ghana',
		'rent control Ghana',
		'hostel management software Ghana',
		'student hostel management system',
		'rental accounting software',
		'property maintenance software',
		'rent ledger',
		'occupancy tracking',
		'digital lease signing',
		'tenant onboarding software',
	],
	tenants: [
		'pay rent with MoMo',
		'mobile money rent payment',
		'MTN MoMo rent collection',
		'rent payment app Ghana',
		'rent receipt app',
		'landlord tenant portal',
		'automated rent reminders Ghana',
		'maintenance request app',
		'self-contained rental',
		'chamber and hall',
		'single room rental Ghana',
	],
	download: [
		'rent payment app Ghana',
		'tenant app Ghana',
		'pay rent with MoMo',
		'rent receipt app',
		'property management app Android',
		'property management app iOS',
	],
	blog: [
		'how to collect rent in Ghana',
		'how to manage rental property in Ghana',
		'what is rent advance',
		'how much rent advance is legal in Ghana',
		'best way to track rent payments',
		'tenant screening checklist Ghana',
		'property management tips Ghana',
	],
	bookings: [
		'short let management Ghana',
		'serviced apartment management software',
		'Airbnb management software Ghana',
		'short stay booking system',
		'guest booking management',
		'vacation rental software Ghana',
		'short stay Accra',
	],
}

const baseKeywords = coreKeywords.join(', ')

export function getSocialMetas({
	url,
	title = `${capitalize(APP_NAME)} — Property management software built to scale your rental business`,
	description = 'Rentloop is property management software built to scale your rental business. Manage properties, tenants, rent, maintenance and rental records in one place.',
	images = [],
	keywords = '',
	origin,
}: {
	images?: Array<string>
	url: string
	title?: string
	description?: string
	keywords?: string | string[]
	origin?: string
}) {
	const pageTerms = Array.isArray(keywords) ? keywords.join(', ') : keywords
	const allKeywords = pageTerms.length
		? `${pageTerms}, ${baseKeywords}`
		: baseKeywords

	if (!images.length && origin) {
		images = [`${origin}/images/og-image.png`]
	}

	const ogImages = images.flatMap((image) => [
		{ property: 'og:image', content: image },
		{ property: 'og:image:width', content: '1200' },
		{ property: 'og:image:height', content: '630' },
		{ property: 'og:image:type', content: 'image/png' },
	])

	const twitterImages = images.map((image) => {
		return { name: 'twitter:image', content: image }
	})

	const truncateDescription =
		description.length > MAX_LENGTH_META_DESCRIPTION
			? description.slice(0, MAX_LENGTH_META_DESCRIPTION) + '...'
			: description.slice(0, MAX_LENGTH_META_DESCRIPTION)

	const fullUrl = url.startsWith('http') ? url : `https://${url}`

	const metas = [
		{ title },
		{ name: 'title', content: title },
		{ name: 'description', content: truncateDescription },
		{
			name: 'keywords',
			content: `${APP_NAME}, ${allKeywords}`,
		},
		{ name: 'robots', content: 'index, follow' },
		{ name: 'author', content: 'RentLoop' },
		{ tagName: 'link', rel: 'canonical', href: fullUrl },
		{ property: 'og:url', content: fullUrl },
		{ property: 'og:site_name', content: capitalize(APP_NAME) },
		{ property: 'og:type', content: 'website' },
		{ property: 'og:title', content: title },
		{ property: 'og:description', content: truncateDescription },
		...ogImages,
		{
			name: 'twitter:card',
			content: images.length ? 'summary_large_image' : 'summary',
		},
		{ name: 'twitter:creator', content: '@rentloopgh' },
		{ name: 'twitter:site', content: '@rentloopgh' },
		{ name: 'twitter:url', content: fullUrl },
		{ name: 'twitter:title', content: title },
		{ name: 'twitter:description', content: truncateDescription },
		...twitterImages,
		{ name: 'twitter:image:alt', content: title },
	]

	if (images.length) {
		metas.push({ name: 'image', content: safeString(images[0]) })
	}

	return metas
}

/**
 * Organization structured data (JSON-LD)
 */
export function getOrganizationSchema(origin: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'RentLoop',
		url: origin,
		logo: `${origin}/logo.png`,
		description:
			'Rentloop is property management software built for Ghana. Manage properties, tenants, rent, maintenance and rental records in one place, with rent collected in cedis via Mobile Money or bank transfer.',
		sameAs: ['https://twitter.com/rentloopgh'],
		areaServed: [
			{ '@type': 'Country', name: 'Ghana' },
			{ '@type': 'Country', name: 'Nigeria' },
			{ '@type': 'Country', name: 'Kenya' },
			{ '@type': 'Country', name: 'South Africa' },
			{ '@type': 'Country', name: 'Canada' },
			{ '@type': 'Country', name: 'United States' },
			{ '@type': 'Country', name: 'United Kingdom' },
			{ '@type': 'City', name: 'Accra' },
			{ '@type': 'City', name: 'Kumasi' },
			{ '@type': 'City', name: 'Takoradi' },
			{ '@type': 'City', name: 'Tamale' },
			{ '@type': 'City', name: 'Lagos' },
			{ '@type': 'City', name: 'Nairobi' },
			{ '@type': 'City', name: 'Johannesburg' },
			{ '@type': 'City', name: 'Toronto' },
			{ '@type': 'City', name: 'New York' },
			{ '@type': 'City', name: 'London' },
		],
		contactPoint: {
			'@type': 'ContactPoint',
			contactType: 'customer service',
			availableLanguage: 'English',
		},
	}
}

/**
 * WebSite structured data for search engines
 */
export function getWebsiteSchema(origin: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'RentLoop',
		url: origin,
		description:
			'Rentloop is property management software built for Ghana. Manage properties, tenants, rent, maintenance and rental records in one place.',
	}
}

/**
 * SoftwareApplication structured data
 */
export function getSoftwareAppSchema(origin: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'RentLoop',
		applicationCategory: 'BusinessApplication',
		operatingSystem: 'Web',
		url: origin,
		description:
			'Rentloop is property management software built for Ghana. Manage properties, tenants, rent, maintenance and rental records in one place.',
		offers: {
			'@type': 'AggregateOffer',
			priceCurrency: 'GHS',
			lowPrice: String(Math.min(...plans.map((plan) => plan.priceMonthly))),
			highPrice: String(Math.max(...plans.map((plan) => plan.priceMonthly))),
			offerCount: String(plans.length),
			offers: plans.map((plan) => ({
				'@type': 'Offer',
				name: `${plan.name} plan`,
				description: plan.description,
				price: String(plan.priceMonthly),
				priceCurrency: 'GHS',
				url: `${origin}/pricing`,
			})),
		},
	}
}

export function getFaqSchema(faqs: { question: string; answer: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((faq) => ({
			'@type': 'Question',
			name: faq.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: faq.answer,
			},
		})),
	}
}

export function getBlogPostingSchema({
	origin,
	url,
	title,
	description,
	datePublished,
	author,
	image,
}: {
	origin: string
	url: string
	title: string
	description: string
	datePublished: string
	author: string
	image?: string
}) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: title,
		description,
		datePublished,
		dateModified: datePublished,
		mainEntityOfPage: { '@type': 'WebPage', '@id': url },
		author: { '@type': 'Organization', name: author, url: origin },
		publisher: {
			'@type': 'Organization',
			name: 'RentLoop',
			logo: { '@type': 'ImageObject', url: `${origin}/logo.png` },
		},
		...(image ? { image: [image] } : {}),
	}
}

export function getBreadcrumbSchema(
	origin: string,
	crumbs: { name: string; path: string }[],
) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: crumbs.map((crumb, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: crumb.name,
			item: `${origin}${crumb.path}`,
		})),
	}
}
