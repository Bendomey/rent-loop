import { useState } from 'react'
import { Outlet, useLoaderData } from 'react-router'
import ApproveTenantApplicationModal from '../approve'
import CancelTenantApplicationModal from '../cancel'
import { PropertyTenantApplicationChecklist } from './components/checklist'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

import { localizedDayjs } from '~/lib/date'
import type { loader } from '~/routes/_auth.properties.$propertyId.tenants.applications.$applicationId'

export function PropertyTenantApplicationContainer() {
	const { tenantApplication } = useLoaderData<typeof loader>()
	const [openCancelModal, setOpenCancelModal] = useState(false)
	const [openApproveModal, setOpenApproveModal] = useState(false)

	if (!tenantApplication) {
		return (
			<div className="m-5 flex items-center justify-center">
				<p className="text-sm text-gray-500">Tenant application not found.</p>
			</div>
		)
	}


	return (
		<div className="m-5 grid grid-cols-12 gap-4">
			<div className="col-span-8">
				<div className="space-y-1">
					<div className="flex items-center space-x-3">
						<h1 className="text-3xl font-bold">
							Application Info #{tenantApplication?.code}
						</h1>

						{tenantApplication?.status ===
						'TenantApplication.Status.InProgress' ? (
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
							? `by ${tenantApplication.created_by.name}`
							: null}
					</span>
				</div>
				<div className="mt-5">
					<Outlet context={{tenantApplication}} />
				</div>
			</div>
			<div className="col-span-4">
				{tenantApplication?.status === 'TenantApplication.Status.InProgress' ? (
					<div className="mb-3 flex w-full flex-row items-center justify-end space-x-2">
						<Button
							variant={'secondary'}
							onClick={() => setOpenCancelModal(true)}
						>
							Cancel
						</Button>
						<Button onClick={() => setOpenApproveModal(true)}>Approve</Button>
					</div>
				) : tenantApplication.status ===
				  'TenantApplication.Status.Cancelled' ? (
					<div className="mb-3 flex w-full flex-row items-center justify-end space-x-2">
						<Button
							variant="destructive"
							onClick={() => setOpenApproveModal(true)}
						>
							Delete application
						</Button>
					</div>
				) : null}
				<PropertyTenantApplicationChecklist application={tenantApplication} />
			</div>
			<CancelTenantApplicationModal
				opened={openCancelModal}
				setOpened={setOpenCancelModal}
				data={tenantApplication}
			/>
			<ApproveTenantApplicationModal
				opened={openApproveModal}
				setOpened={setOpenApproveModal}
				data={tenantApplication}
			/>
		</div>
	)
}
