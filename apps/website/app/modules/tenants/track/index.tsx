import { useCallback, useEffect, useState } from 'react'
import { useLoaderData } from 'react-router'

import { TrackingDashboard } from './components/tracking-dashboard'
import { VerifyOtp } from './components/verify-otp'
import { getTrackingApplication } from '~/api/tracking'
import { Spinner } from '~/components/ui/spinner'
import type { loader } from '~/routes/tenant-applications.$code'

function getStorageKey(code: string) {
	return `tracking:${code}`
}

export function TenantApplicationTrackingModule() {
	const { code } = useLoaderData<typeof loader>()
	const [accessToken, setAccessToken] = useState<string | null>(null)
	const [application, setApplication] = useState<TrackingApplication | null>(
		null,
	)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const stored = sessionStorage.getItem(getStorageKey(code))
		if (stored) {
			try {
				const parsed = JSON.parse(stored) as { access_token: string }
				getTrackingApplication(code, parsed.access_token)
					.then((data) => {
						if (data) {
							setAccessToken(parsed.access_token)
							setApplication(data)
						}
					})
					.catch(() => {
						sessionStorage.removeItem(getStorageKey(code))
					})
					.finally(() => {
						setIsLoading(false)
					})
			} catch {
				sessionStorage.removeItem(getStorageKey(code))
				setIsLoading(false)
			}
		} else {
			setIsLoading(false)
		}
	}, [code])

	const handleVerified = useCallback(
		(token: string, app: TrackingApplication) => {
			sessionStorage.setItem(
				getStorageKey(code),
				JSON.stringify({ access_token: token }),
			)
			setAccessToken(token)
			setApplication(app)
		},
		[code],
	)

	if (isLoading) {
		return (
			<div className="flex min-h-dvh items-center justify-center">
				<Spinner />
			</div>
		)
	}

	if (!accessToken || !application) {
		return <VerifyOtp code={code} onVerified={handleVerified} />
	}

	return <TrackingDashboard application={application} code={code} />
}
