import { useEffect, useState } from 'react'
import { Outlet, useLoaderData } from 'react-router'
import ApproveTenantApplicationModal from '../approve'
import CancelTenantApplicationModal from '../cancel'
import DeleteTenantApplicationModal from '../delete'
import { PropertyTenantApplicationChecklist } from './components/checklist'
import { useCalculateChecklist } from './components/use-calculate-checklist'
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
import type { loader } from '~/routes/_auth.properties.$propertyId.tenants.applications.$applicationId'

export function PropertyTenantApplicationContainer() {
	const { tenantApplication, clientUserProperty } =
		useLoaderData<typeof loader>()
	const [openCancelModal, setOpenCancelModal] = useState(false)
	const [openApproveModal, setOpenApproveModal] = useState(false)
	const [openDeleteModal, setOpenDeleteModal] = useState(false)

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
	const { progress } = useCalculateChecklist(tenantApplication)

	return (
		<div className="m-5 grid grid-cols-12 gap-4">
			<div className="order-2 col-span-12 lg:order-1 lg:col-span-8">
				<div className="max-lg:hidden">{applicationHeaderInfo}</div>
				<div className="mt-5">
					<Outlet context={{ tenantApplication }} />
				</div>
			</div>
			<div className="order-1 col-span-12 flex flex-col gap-3 lg:order-2 lg:col-span-4 lg:mt-2 lg:gap-6">
				<div className="lg:hidden">{applicationHeaderInfo}</div>
				{tenantApplication?.status === 'TenantApplication.Status.InProgress' ? (
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
								disabled={progress !== 100}
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
		</div>
	)
}
