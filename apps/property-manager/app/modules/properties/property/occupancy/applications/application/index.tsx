import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Outlet, useLoaderData } from 'react-router'
import ApproveTenantApplicationModal from '../approve'
import { WhatsNextModal } from '../approve/next-steps-modal'
import CancelTenantApplicationModal from '../cancel'
import DeleteTenantApplicationModal from '../delete'
import { PropertyTenantApplicationChecklist } from './components/checklist'
import { useCalculateChecklist } from './components/use-calculate-checklist'
import { useGetPropertyLeases } from '~/api/leases'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { useTour } from '~/hooks/use-tour'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import { TENANT_APPLICATION_TOUR_STEPS, TOUR_KEYS } from '~/lib/tours'
import { useClient } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.occupancy.applications.$applicationId'

export function PropertyTenantApplicationContainer() {
	const { tenantApplication, clientUserProperty } =
		useLoaderData<typeof loader>()
	const { clientUser } = useClient()
	const [openCancelModal, setOpenCancelModal] = useState(false)
	const [openApproveModal, setOpenApproveModal] = useState(false)
	const [openDeleteModal, setOpenDeleteModal] = useState(false)
	const [openNextStepsModal, setOpenNextStepsModal] = useState(false)

	const { startTour, hasCompletedTour } = useTour(
		TOUR_KEYS.TENANT_APPLICATION,
		TENANT_APPLICATION_TOUR_STEPS,
	)

	useEffect(() => {
		if (!hasCompletedTour()) startTour()
	}, [hasCompletedTour, startTour])

	const isInvoicePaid = ['PAID', 'PARTIALLY_PAID'].includes(
		tenantApplication?.application_payment_invoice?.status ?? '',
	)

	const isCompleted =
		tenantApplication?.status === 'TenantApplication.Status.Completed'

	// The lease created from this application isn't linked on the tenant
	// application itself, so it's looked up by the unit it was created for.
	const { data: unitLeases } = useGetPropertyLeases(
		safeString(clientUser?.client_id),
		isCompleted ? safeString(clientUserProperty?.property_id) : '',
		{
			pagination: { page: 1, per: 5 },
			sorter: {},
			search: {},
			filters: { unit_ids: [safeString(tenantApplication?.desired_unit_id)] },
		},
	)
	const lease = unitLeases?.rows?.find(
		(l) => l.tenant_application_id === tenantApplication?.id,
	)

	if (!tenantApplication) {
		return (
			<div className="m-5 flex items-center justify-center">
				<p className="text-sm text-gray-500">Lease application not found.</p>
			</div>
		)
	}

	const applicationHeaderInfo = (
		<div id="application-header" className="space-y-1">
			<div className="flex items-center space-x-3">
				<h1 className="text-3xl font-bold">
					Application Info #{tenantApplication?.code}
				</h1>

				{tenantApplication?.status === 'TenantApplication.Status.InProgress' ? (
					<Badge
						variant="secondary"
						className="bg-amber-400 px-2 py-1 text-xs text-amber-50"
					>
						In Progress
					</Badge>
				) : tenantApplication?.status ===
				  'TenantApplication.Status.Cancelled' ? (
					<Badge variant="destructive">Cancelled</Badge>
				) : tenantApplication?.status ===
				  'TenantApplication.Status.Completed' ? (
					<Badge
						variant="default"
						className="bg-green-600 px-2 py-1 text-xs text-green-50"
					>
						Completed
					</Badge>
				) : null}
			</div>
			<span className="text-sm text-gray-500">
				Submitted on{' '}
				<strong>
					{localizedDayjs(tenantApplication?.created_at).format('LLLL')}
				</strong>{' '}
				{tenantApplication?.created_by
					? `by ${tenantApplication.created_by.user?.name}`
					: null}
			</span>
		</div>
	)

	// eslint-disable-next-line react-hooks/rules-of-hooks
	const { canApprove } = useCalculateChecklist(tenantApplication)

	return (
		<div>
			{isCompleted && (
				<div className="m-5 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex gap-3">
							<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
								<CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
							</div>
							<div className="space-y-0.5">
								<p className="text-sm font-medium text-green-900 dark:text-green-200">
									Lease is created
								</p>
								<p className="text-sm text-green-700 dark:text-green-400">
									This application has been approved and its details can no
									longer be edited here. Head to the{' '}
									<Link
										to={`/properties/${safeString(clientUserProperty?.property_id)}/occupancy/tenants`}
										className="font-medium underline hover:no-underline"
									>
										tenants page
									</Link>{' '}
									to make changes.
								</p>
							</div>
						</div>
						{lease && (
							<Button
								variant="outline"
								size="sm"
								className="shrink-0 gap-1.5 border-green-300 bg-white text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-transparent dark:text-green-300 dark:hover:bg-green-900"
								onClick={() => setOpenNextStepsModal(true)}
							>
								What&apos;s next?
								<ArrowRight className="size-4" />
							</Button>
						)}
					</div>
				</div>
			)}
			<div className="m-5 grid grid-cols-12 gap-4">
				<div className="order-2 col-span-12 lg:order-1 lg:col-span-8">
					<div className="max-lg:hidden">{applicationHeaderInfo}</div>
					<div className="mt-5">
						<Outlet context={{ tenantApplication }} />
					</div>
				</div>
				<div className="order-1 col-span-12 flex flex-col gap-3 lg:order-2 lg:col-span-4 lg:mt-2 lg:gap-6">
					<div className="lg:hidden">{applicationHeaderInfo}</div>
					{tenantApplication?.status ===
					'TenantApplication.Status.InProgress' ? (
						<PropertyPermissionGuard roles={['MANAGER']}>
							<div
								id="application-actions"
								className="mb-2 flex w-full flex-row items-center justify-end space-x-2 lg:mb-3"
							>
								<Tooltip>
									<TooltipTrigger asChild>
										<span>
											<Button
												variant="secondary"
												disabled={isInvoicePaid}
												onClick={() => setOpenCancelModal(true)}
											>
												Cancel
											</Button>
										</span>
									</TooltipTrigger>
									{isInvoicePaid && (
										<TooltipContent>
											Cannot cancel after invoice payments have been made
										</TooltipContent>
									)}
								</Tooltip>
								<Button
									disabled={!canApprove}
									onClick={() => setOpenApproveModal(true)}
								>
									Approve
								</Button>
							</div>
						</PropertyPermissionGuard>
					) : null}
					{/* tenantApplication.status ===
				  'TenantApplication.Status.Cancelled' ? (
					<PropertyPermissionGuard roles={['MANAGER']}>
						<div
							id="application-actions"
							className="mb-3 flex w-full flex-row items-center justify-end space-x-2"
						>
							<Button
								variant="destructive"
								onClick={() => setOpenDeleteModal(true)}
							>
								Delete application
							</Button>
						</div>
					</PropertyPermissionGuard>
				) : null} */}
					<div id="application-checklist">
						<PropertyTenantApplicationChecklist
							propertyId={safeString(clientUserProperty?.property_id)}
							application={tenantApplication}
						/>
					</div>
				</div>
				<CancelTenantApplicationModal
					opened={openCancelModal}
					setOpened={setOpenCancelModal}
					data={tenantApplication}
					propertyId={safeString(clientUserProperty?.property_id)}
				/>
				<ApproveTenantApplicationModal
					opened={openApproveModal}
					setOpened={setOpenApproveModal}
					data={tenantApplication}
					propertyId={safeString(clientUserProperty?.property_id)}
				/>
				<DeleteTenantApplicationModal
					opened={openDeleteModal}
					setOpened={setOpenDeleteModal}
					data={tenantApplication}
					propertyId={safeString(clientUserProperty?.property_id)}
				/>
				{lease && (
					<WhatsNextModal
						opened={openNextStepsModal}
						setOpened={setOpenNextStepsModal}
						name={[
							tenantApplication.first_name,
							tenantApplication.other_names,
							tenantApplication.last_name,
						]
							.filter(Boolean)
							.join(' ')}
						propertyId={safeString(clientUserProperty?.property_id)}
						lease={lease}
					/>
				)}
			</div>
		</div>
	)
}
