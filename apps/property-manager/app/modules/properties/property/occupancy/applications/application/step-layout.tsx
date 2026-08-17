import { Outlet, useRouteLoaderData } from 'react-router'
import { PropertyTenantApplicationChecklist } from './components/checklist'
import { Badge } from '~/components/ui/badge'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import type { loader } from '~/routes/_auth.properties.$propertyId.occupancy.applications.$applicationId'

/**
 * The shell the five step pages share.
 *
 * The overview is deliberately not inside this layout: its step cards are the
 * checklist rail in expanded form, so rendering both on one page would show
 * the same five states twice.
 *
 * Approve and decline are not here either. They live on the overview alone —
 * one decision surface rather than a pair of buttons on every step page.
 */
export function PropertyTenantApplicationStepLayout() {
	// The loader belongs to the parent `$applicationId` route, not to this one.
	// `useLoaderData` would return this route's own data, which is undefined —
	// a layout route with no loader has none.
	const loaderData = useRouteLoaderData<Awaited<ReturnType<typeof loader>>>(
		'routes/_auth.properties.$propertyId.occupancy.applications.$applicationId',
	)
	const tenantApplication = loaderData?.tenantApplication
	const clientUserProperty = loaderData?.clientUserProperty

	if (!tenantApplication) {
		return (
			<div className="m-5 flex items-center justify-center">
				<p className="text-muted-foreground text-sm">
					Lease application not found.
				</p>
			</div>
		)
	}

	const header = (
		<div id="application-header" className="space-y-1">
			<div className="flex items-center space-x-3">
				<h1 className="text-3xl font-bold">
					Application Info #{tenantApplication.code}
				</h1>

				{tenantApplication.status === 'TenantApplication.Status.InProgress' ? (
					<Badge variant="secondary" className="bg-warning-bg text-warning">
						In Progress
					</Badge>
				) : tenantApplication.status ===
				  'TenantApplication.Status.Cancelled' ? (
					<Badge variant="destructive">Cancelled</Badge>
				) : (
					<Badge variant="default" className="bg-success-bg text-success">
						Completed
					</Badge>
				)}
			</div>
			<span className="text-muted-foreground text-sm">
				Submitted on{' '}
				<strong>
					{localizedDayjs(tenantApplication.created_at).format('LLLL')}
				</strong>{' '}
				{tenantApplication.created_by
					? `by ${tenantApplication.created_by.user?.name}`
					: null}
			</span>
		</div>
	)

	return (
		<div className="m-5 grid grid-cols-12 gap-4">
			<div className="order-2 col-span-12 lg:order-1 lg:col-span-8">
				<div className="max-lg:hidden">{header}</div>
				<div className="mt-5">
					<Outlet context={{ tenantApplication }} />
				</div>
			</div>
			<div className="order-1 col-span-12 flex flex-col gap-3 lg:order-2 lg:col-span-4 lg:mt-2 lg:gap-6">
				<div className="lg:hidden">{header}</div>
				<div id="application-checklist">
					<PropertyTenantApplicationChecklist
						propertyId={safeString(clientUserProperty?.property_id)}
						application={tenantApplication}
					/>
				</div>
			</div>
		</div>
	)
}
