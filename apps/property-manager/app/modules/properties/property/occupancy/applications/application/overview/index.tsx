import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useRouteLoaderData } from 'react-router'
import ApproveTenantApplicationModal from '../../approve'
import { WhatsNextModal } from '../../approve/next-steps-modal'
import CancelTenantApplicationModal from '../../cancel'
import { OverviewFactsRail } from './facts-rail'
import { OverviewLeadCard } from './lead-card'
import { SITUATION_LABEL } from './overview-copy'
import { OverviewStepCard } from './step-card'
import { useApplicationOverview } from './use-application-overview'
import { useGetPropertyLeases } from '~/api/leases'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { useTour } from '~/hooks/use-tour'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import { TENANT_APPLICATION_TOUR_STEPS, TOUR_KEYS } from '~/lib/tours'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.occupancy.applications.$applicationId'

/**
 * The application, as a home page.
 *
 * Each of the five steps has a page of its own, so something has to hold them
 * together and answer the question a landlord actually arrives with: what do I
 * do next. That sentence is the top of the page.
 *
 * This is also the only place an application can be approved or declined. The
 * step pages carry the checklist rail for navigation and nothing else.
 */
export function PropertyTenantApplicationOverview() {
	// The loader belongs to the parent `$applicationId` route. An index route
	// has no loader of its own, so `useLoaderData` would be undefined here.
	const loaderData = useRouteLoaderData<Awaited<ReturnType<typeof loader>>>(
		'routes/_auth.properties.$propertyId.occupancy.applications.$applicationId',
	)
	const tenantApplication = loaderData?.tenantApplication
	const clientUserProperty = loaderData?.clientUserProperty

	const { clientUser } = useClient()
	const [openCancel, setOpenCancel] = useState(false)
	const [openApprove, setOpenApprove] = useState(false)
	const [openNextSteps, setOpenNextSteps] = useState(false)

	const { startTour, hasCompletedTour } = useTour(
		TOUR_KEYS.TENANT_APPLICATION,
		TENANT_APPLICATION_TOUR_STEPS,
	)
	useEffect(() => {
		if (!hasCompletedTour()) startTour()
	}, [hasCompletedTour, startTour])

	const propertyId = safeString(clientUserProperty?.property_id)
	const baseUrl = `/properties/${propertyId}/occupancy/applications/${tenantApplication?.id}`

	const isCompleted =
		tenantApplication?.status === 'TenantApplication.Status.Completed'

	// The lease created from this application isn't linked on the application
	// itself, so it's looked up by the unit it was created for.
	const { data: unitLeases } = useGetPropertyLeases(
		safeString(clientUser?.client_id),
		isCompleted ? propertyId : '',
		{
			pagination: { page: 1, per: 5 },
			sorter: {},
			search: {},
			filters: { unit_ids: [safeString(tenantApplication?.desired_unit_id)] },
		},
	)
	const lease = unitLeases?.rows?.find(
		(row) => row.tenant_application_id === tenantApplication?.id,
	)

	// Every hook runs before the guard below: React requires a stable call
	// order, so the early return cannot come first.
	const overview = useApplicationOverview(
		tenantApplication as TenantApplication,
		baseUrl,
	)

	if (!tenantApplication) {
		return (
			<div className="m-5 flex items-center justify-center">
				<p className="text-muted-foreground text-sm">
					Lease application not found.
				</p>
			</div>
		)
	}

	const { situation, steps, copy, lead, leadStep, progress, doneCount } =
		overview

	const fullName = [
		tenantApplication.first_name,
		tenantApplication.other_names,
		tenantApplication.last_name,
	]
		.filter(Boolean)
		.join(' ')

	// Money has moved once anything on the account is settled. Declining after
	// that is refused — the rule the checklist rail used to carry. This gate
	// lifts once refunds ship: a decline will be able to trigger one instead of
	// just being blocked.
	const paymentsMade =
		(tenantApplication.financial_account?.total_settled ?? 0) > 0

	const isCancelled =
		tenantApplication.status === 'TenantApplication.Status.Cancelled'

	const barTone =
		situation === 'attention'
			? '[&>*]:bg-warning!'
			: situation === 'approved'
				? '[&>*]:bg-success!'
				: ''

	const subtitle = isCompleted
		? `Approved on ${localizedDayjs(tenantApplication.completed_at).format('D MMMM YYYY')}`
		: isCancelled
			? `Declined on ${localizedDayjs(tenantApplication.cancelled_at).format('D MMMM YYYY')}`
			: `${doneCount} of ${steps.length} steps done · applied on ${localizedDayjs(tenantApplication.created_at).format('D MMMM')}`

	return (
		<div>
			{isCompleted ? (
				<div className="bg-success-bg m-5 rounded-lg border p-4">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex gap-3">
							<CheckCircle2 className="text-success mt-0.5 size-5 shrink-0" />
							<div className="space-y-0.5">
								<p className="text-success text-sm font-medium">
									Lease is created
								</p>
								<p className="text-sm">
									This application has been approved and its details can no
									longer be edited here. Head to the{' '}
									<Link
										to={`/properties/${propertyId}/occupancy/tenants`}
										className="font-medium underline hover:no-underline"
									>
										tenants page
									</Link>{' '}
									to make changes.
								</p>
							</div>
						</div>
						{lease ? (
							<Button
								variant="outline"
								size="sm"
								className="shrink-0"
								onClick={() => setOpenNextSteps(true)}
							>
								What&apos;s next?
								<ArrowRight className="size-4" />
							</Button>
						) : null}
					</div>
				</div>
			) : null}

			<div className="m-5">
				<div
					id="application-header"
					className="mb-6 flex flex-wrap items-start justify-between gap-6"
				>
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-3">
							<h1 className="text-3xl font-bold tracking-tight">
								{tenantApplication.first_name}&rsquo;s application
							</h1>
							<Badge
								variant="secondary"
								className={cn(
									situation === 'approved' ? 'bg-success-bg text-success' : '',
									situation === 'attention' ? 'bg-warning-bg text-warning' : '',
								)}
							>
								{SITUATION_LABEL[situation]}
							</Badge>
						</div>
						<p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
					</div>

					<div className="w-64 shrink-0">
						<div className="mb-2 flex justify-between">
							<span className="text-muted-foreground text-xs font-semibold">
								Progress
							</span>
							<span className="font-mono text-xs font-bold tabular-nums">
								{Math.round(progress)}%
							</span>
						</div>
						<Progress value={progress} className={cn('bg-muted', barTone)} />
					</div>
				</div>

				<div className="grid grid-cols-12 gap-6">
					<div className="col-span-12 lg:col-span-8">
						<OverviewLeadCard
							situation={situation}
							lead={lead}
							leadHref={leadStep?.href ?? null}
							unitHref={`${baseUrl}/unit`}
							leaseHref={
								lease
									? `/properties/${propertyId}/occupancy/leases/${lease.id}`
									: null
							}
							canApprove={overview.canApprove}
							declineDisabled={paymentsMade}
							onApprove={() => setOpenApprove(true)}
							onDecline={() => setOpenCancel(true)}
						/>

						<div className="mt-6 mb-3.5 flex flex-wrap items-baseline gap-3">
							<h2 className="text-lg font-bold">The five steps</h2>
							<span className="text-muted-foreground text-sm">
								Click any one to open it. Do them in any order that&rsquo;s
								possible.
							</span>
						</div>

						<div id="application-steps" className="flex flex-col gap-3">
							{steps.map((step) => (
								<OverviewStepCard
									key={step.key}
									step={step}
									copy={copy[step.key] ?? { title: step.label, what: '' }}
									lead={leadStep?.key === step.key}
								/>
							))}
						</div>
					</div>

					<div className="col-span-12 lg:col-span-4">
						<OverviewFactsRail
							application={tenantApplication}
							pronouns={overview.pronouns}
							fullName={fullName}
							unitHref={`${baseUrl}/unit`}
							tenantHref={
								isCompleted && lease?.tenant_id
									? `/properties/${propertyId}/occupancy/tenants/${lease.tenant_id}`
									: null
							}
							showDecline={!isCompleted && !isCancelled}
							declineDisabled={paymentsMade}
							onDecline={() => setOpenCancel(true)}
						/>
					</div>
				</div>
			</div>

			<CancelTenantApplicationModal
				opened={openCancel}
				setOpened={setOpenCancel}
				data={tenantApplication}
				propertyId={propertyId}
			/>
			<ApproveTenantApplicationModal
				opened={openApprove}
				setOpened={setOpenApprove}
				data={tenantApplication}
				propertyId={propertyId}
			/>
			{lease ? (
				<WhatsNextModal
					opened={openNextSteps}
					setOpened={setOpenNextSteps}
					name={fullName}
					propertyId={propertyId}
					lease={lease}
				/>
			) : null}
		</div>
	)
}
