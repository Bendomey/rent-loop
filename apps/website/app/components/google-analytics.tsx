import { useEffect } from 'react'
import { useLocation } from 'react-router'

interface Props {
	gaId: string
}

export function GoogleAnalytics({ gaId }: Props) {
	const location = useLocation()

	useEffect(() => {
		if (!gaId) return

		// Inject gtag.js script once
		if (!document.getElementById('ga-script')) {
			const script = document.createElement('script')
			script.id = 'ga-script'
			script.async = true
			script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
			document.head.appendChild(script)

			window.dataLayer = window.dataLayer ?? []
			window.gtag = function gtag() {
				// eslint-disable-next-line prefer-rest-params
				window.dataLayer.push(arguments)
			}
			window.gtag('js', new Date())
			window.gtag('config', gaId, { send_page_view: false })
		}
	}, [gaId])

	// Track page views on every navigation
	useEffect(() => {
		if (!gaId || typeof window.gtag !== 'function') return
		window.gtag('event', 'page_view', { page_path: location.pathname + location.search })
	}, [gaId, location])

	return null
}
