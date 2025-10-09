import { APP_NAME } from './constants.ts'
import { safeString } from './strings.ts'

const MAX_LENGTH_META_DESCRIPTION = 200

const baseKeywords =
	'property management, rental management, real estate software, tenant management, lease management, maintenance tracking, rent collection, property analytics, landlord tools, property manager software, real estate management, rental property software, tenant screening, online rent payments, property marketing, lease agreements, maintenance requests, financial reporting, property inspections, vacancy management, rental listings'

export function getSocialMetas({
	url,
	title = `Manage your properties | ${APP_NAME}`,
	description = 'Property rental lifecycle management software integrating everything in one place 🚀',
	images = [],
	keywords = '',
	origin,
}: {
	images?: Array<string>
	url: string
	title?: string
	description?: string
	keywords?: string
	origin?: string
}) {
	if (keywords.length) {
		keywords = keywords.concat(`, ${baseKeywords}`)
	} else {
		keywords = baseKeywords
	}

	if (!images.length && origin) {
		images = [`${origin}/logo.png`]
	}

	const ogImages = images.map((image) => {
		return { name: 'og:image', content: image }
	})

	const twitterImages = images.map((image) => {
		return { name: 'twitter:image', content: image }
	})

	const truncateDescription =
		description.length > MAX_LENGTH_META_DESCRIPTION
			? description.slice(0, MAX_LENGTH_META_DESCRIPTION) + '...'
			: description.slice(0, MAX_LENGTH_META_DESCRIPTION)

	const metas = [
		{ title },
		{ name: 'title', content: title },
		{ name: 'description', content: truncateDescription },
		{
			name: 'keywords',
			content: `${APP_NAME}${keywords ? `, ${keywords}` : ''}`,
		},
		{ name: 'og:url', content: url },
		{ name: 'og:site_name', content: APP_NAME },
		{ name: 'og:type', content: 'website' },
		{ name: 'og:title', content: title },
		{ name: 'og:description', content: truncateDescription },
		...ogImages,
		{
			name: 'twitter:card',
			content: images.length ? 'summary_large_image' : 'summary',
		},
		{ name: 'twitter:creator', content: '@rentloopgh' },
		{ name: 'twitter:site', content: '@rentloopgh' },
		{ name: 'twitter:url', content: url },
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
