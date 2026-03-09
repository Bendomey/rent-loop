import { useFetcher, useLoaderData } from 'react-router'

import { TrackingDashboard } from './components/tracking-dashboard'
import { VerifyOtp } from './components/verify-otp'
import type { loader } from '~/routes/tenant-applications.$code'

export function TenantApplicationTrackingModule() {
	const { code, application } = useLoaderData<typeof loader>()
	const fetcher = useFetcher<{ application?: TrackingApplication | null }>()

	// After a successful verifyOtp action, the fetcher data has the application
	const verifiedApplication =
		fetcher.data?.application ?? application ?? null

	if (verifiedApplication) {
		return <TrackingDashboard application={verifiedApplication} code={code} />
	}

	return <VerifyOtp code={code} fetcher={fetcher} />
}
