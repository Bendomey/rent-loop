import dayjs from 'dayjs'
import { Building2, Calendar, MapPin } from 'lucide-react'

import { ApplicationChecklist } from './application-checklist'
import { LeaseDocumentCard } from './lease-document-card'
import { PaymentInfo } from './payment-info'
import { APP_NAME } from '~/lib/constants'
import { formatAmount } from '~/lib/format-amount'
import { cn } from '~/lib/utils'

interface Props {
	application: TrackingApplication
	code: string
}

const STATUS_CONFIG: Record<
	TrackingApplication['status'],
	{ label: string; className: string }
> = {
	'TenantApplication.Status.InProgress': {
		label: 'In Progress',
		className: 'bg-yellow-100 text-yellow-700',
	},
	'TenantApplication.Status.Completed': {
		label: 'Completed',
		className: 'bg-green-100 text-green-700',
	},
	'TenantApplication.Status.Cancelled': {
		label: 'Cancelled',
		className: 'bg-red-100 text-red-700',
	},
}

export function TrackingDashboard({ application, code }: Props) {
	const statusConfig = STATUS_CONFIG[application.status]

	return (
		<div className="min-h-dvh">
			{/* Header */}
			<header className="border-b bg-white">
				<div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
					<div className="flex flex-row items-end">
						<span className="text-2xl font-extrabold text-rose-700">
							{APP_NAME.slice(0, 4)}
						</span>
						<span className="text-2xl font-extrabold">{APP_NAME.slice(4)}</span>
					</div>
					<span className="text-xs text-slate-400">Application Tracker</span>
				</div>
			</header>

			<main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
				{/* Application header card */}
				<div className="rounded-lg border bg-white p-6">
					<div className="flex items-start justify-between">
						<div>
							<p className="text-xs font-medium text-slate-400">Application</p>
							<p className="mt-0.5 text-lg font-bold text-slate-900">#{code}</p>
						</div>
						<span
							className={cn(
								'rounded-full px-2.5 py-0.5 text-xs font-medium',
								statusConfig.className,
							)}
						>
							{statusConfig.label}
						</span>
					</div>

					<div className="mt-4 space-y-2">
						<p className="text-sm font-medium text-slate-900">
							{application.first_name} {application.last_name}
						</p>

						{application.desired_unit && (
							<div className="flex items-center gap-2 text-sm text-slate-500">
								<Building2 className="h-4 w-4" />
								<span>
									{application.desired_unit.name}
									{application.desired_unit.property?.name &&
										` at ${application.desired_unit.property.name}`}
								</span>
							</div>
						)}

						{application.desired_unit?.property?.address && (
							<div className="flex items-center gap-2 text-sm text-slate-500">
								<MapPin className="h-4 w-4" />
								<span>{application.desired_unit.property.address}</span>
							</div>
						)}

						{application.created_at && (
							<div className="flex items-center gap-2 text-sm text-slate-500">
								<Calendar className="h-4 w-4" />
								<span>
									Applied {dayjs(application.created_at).format('MMM D, YYYY')}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Progress checklist */}
				<ApplicationChecklist progress={application.checklist_progress} />

				{/* Financial summary */}
				<div className="rounded-lg border bg-white p-6">
					<h3 className="text-sm font-semibold text-slate-900">
						Financial Summary
					</h3>
					<dl className="mt-3 space-y-2 text-sm">
						<div className="flex justify-between">
							<dt className="text-slate-500">Rent</dt>
							<dd className="font-medium text-slate-700">
								{formatAmount(application.rent_fee)}
								{application.payment_frequency &&
									` / ${application.payment_frequency.toLowerCase()}`}
							</dd>
						</div>

						{application.security_deposit_fee != null && (
							<div className="flex justify-between">
								<dt className="text-slate-500">Security Deposit</dt>
								<dd className="font-medium text-slate-700">
									{formatAmount(application.security_deposit_fee)}
								</dd>
							</div>
						)}

						{application.initial_deposit_fee != null && (
							<div className="flex justify-between">
								<dt className="text-slate-500">Initial Deposit</dt>
								<dd className="font-medium text-slate-700">
									{formatAmount(application.initial_deposit_fee)}
								</dd>
							</div>
						)}

						{application.desired_move_in_date && (
							<div className="flex justify-between">
								<dt className="text-slate-500">Move-in Date</dt>
								<dd className="font-medium text-slate-700">
									{dayjs(application.desired_move_in_date).format(
										'MMM D, YYYY',
									)}
								</dd>
							</div>
						)}

						{application.stay_duration != null &&
							application.stay_duration_frequency && (
								<div className="flex justify-between">
									<dt className="text-slate-500">Duration</dt>
									<dd className="font-medium text-slate-700">
										{application.stay_duration}{' '}
										{application.stay_duration_frequency.toLowerCase()}
									</dd>
								</div>
							)}
					</dl>
				</div>

				{/* Lease document */}
				<LeaseDocumentCard
					status={application.lease_agreement_document_status}
					signingUrl={application.lease_agreement_document_signing_url}
					documentUrl={application.lease_agreement_document_url}
				/>

				{/* Payment info */}
				<PaymentInfo invoice={application.application_payment_invoice} />
			</main>
		</div>
	)
}
