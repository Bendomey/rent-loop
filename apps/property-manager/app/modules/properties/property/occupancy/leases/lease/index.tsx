import { ExternalLink, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLoaderData, useSearchParams } from 'react-router'
import { ChecklistAlerts } from './components/checklist-alerts'
import { ChecklistSection } from './components/checklist-section'
import { DetailField, DetailPanel } from './components/detail-field'
import { DocumentRow } from './components/document-row'
import { LeaseAgreementDocumentSetup } from './components/lease-agreement-document-setup'
import { LeaseHeader } from './components/lease-header'
import { LeaseSummaryCard } from './components/lease-summary-card'
import { StartLeaseDialog } from './components/start-lease-dialog'
import { LeaseFinancialsTab } from './financials'
import { overdueTotal } from './financials/account'
import { useGetInvoices } from '~/api/invoices'
import { useHasPropertyPermissions } from '~/components/permissions/use-has-role'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useTour } from '~/hooks/use-tour'
import { PermissionState } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import {
	getPaymentFrequencyLabel,
	getPaymentFrequencyPeriodLabel,
} from '~/lib/properties.utils'
import { getInitials, safeString, toFirstUpperCase } from '~/lib/strings'
import { LEASE_DETAIL_TOUR_STEPS, TOUR_KEYS } from '~/lib/tours'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.occupancy.leases.$leaseId'

export function LeaseDetailModule() {
	const { lease, clientUserProperty, documentTemplates } =
		useLoaderData<typeof loader>()
	const [searchParams] = useSearchParams()
	const initialTab = searchParams.get('tab') ?? 'details'
	const { clientUserProperty: ctxProp } = useProperty()
	const { clientUser } = useClient()
	const { hasPermissions: managerPermission } = useHasPropertyPermissions({
		roles: ['MANAGER'],
	})
	const [startLeaseOpen, setStartLeaseOpen] = useState(false)
	const { startTour, hasCompletedTour } = useTour(
		TOUR_KEYS.LEASE_DETAIL,
		LEASE_DETAIL_TOUR_STEPS,
	)

	useEffect(() => {
		if (!hasCompletedTour()) startTour()
	}, [hasCompletedTour, startTour])

	const propertyId =
		clientUserProperty?.property_id ?? ctxProp?.property_id ?? ''
	const clientId = safeString(clientUser?.client_id)

	// The tab carries a dot while anything is overdue, so the badge is read off
	// the same invoice list the tab renders rather than a second source.
	const accountId = lease?.financial_account?.id ?? null
	const { data: invoicePage } = useGetInvoices(clientId, propertyId, {
		pagination: { page: 1, per: 200 },
		filters: { financial_account_id: accountId ?? undefined },
		// Payments is not optional: the balance on every row is total_amount less
		// the SUCCESSFUL payments, so without it a part-paid invoice reads as
		// wholly unpaid and the overdue figure is overstated.
		populate: ['LineItems', 'Payments'],
	})
	const overdue = overdueTotal(
		(invoicePage?.rows ?? []).filter((invoice) => invoice.status !== 'VOID'),
	)

	if (!lease) {
		return (
			<div className="flex h-full items-center justify-center p-10">
				<p className="text-muted-foreground text-sm">Lease not found</p>
			</div>
		)
	}

	const tenant = lease.tenant
	const unit = lease.unit
	const application = lease.tenant_application
	const isTerminable = lease.status === 'Lease.Status.Active'
	const isPending = lease.status === 'Lease.Status.Pending'
	const canEditChecklist = managerPermission === PermissionState.AUTHORIZED

	const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : null
	const subtitle = `Lease · ${unit?.name ?? '—'} · ${tenantName ?? '—'}`

	return (
		<>
			<div className="mx-auto flex max-w-6xl flex-col">
				<ChecklistAlerts
					lease={lease}
					canEdit={canEditChecklist}
					propertyId={propertyId}
				/>

				<div className="mx-5 mt-5">
					<LeaseHeader
						lease={lease}
						subtitle={subtitle}
						isPending={isPending}
						isTerminable={isTerminable}
						onStartLease={() => setStartLeaseOpen(true)}
					/>
				</div>

				<div className="m-5 grid grid-cols-12 gap-6">
					{/* Sidebar */}
					<div id="lease-sidebar" className="col-span-12 lg:col-span-4">
						<LeaseSummaryCard
							lease={lease}
							propertyId={propertyId}
							tenant={tenant}
							unit={unit}
							application={application}
						/>
					</div>

					{/* Main Content */}
					{/* min-w-0: a grid item defaults to min-width:auto, so without this
					    the column grows to fit the tab strip and the whole page scrolls
					    sideways instead of the strip scrolling inside it. */}
					<div className="col-span-12 min-w-0 lg:col-span-8">
						<div>
							<Tabs defaultValue={initialTab}>
								<TabsList
									id="lease-tabs"
									className="max-w-full justify-start overflow-x-auto"
								>
									<TabsTrigger value="details">Lease Details</TabsTrigger>
									<TabsTrigger value="tenant">Tenant Profile</TabsTrigger>
									<TabsTrigger value="documents">Documents</TabsTrigger>
									<TabsTrigger value="financials">
										Financials
										{overdue > 0 ? (
											<span
												aria-label="Overdue"
												className="bg-primary size-1.5 rounded-full"
											/>
										) : null}
									</TabsTrigger>
								</TabsList>

								{/* Details Tab */}
								<TabsContent value="details" className="mt-4 space-y-4">
									<DetailPanel label="Lease terms">
										<div className="grid grid-cols-2 gap-4">
											<DetailField
												label="Payment Frequency"
												value={
													getPaymentFrequencyLabel(
														lease.payment_frequency ?? '',
													) || '—'
												}
											/>
											<DetailField
												label="Duration"
												value={`${lease.stay_duration} ${getPaymentFrequencyPeriodLabel(lease.stay_duration_frequency, lease.stay_duration)}`}
											/>
											<DetailField
												label="Move-in Date"
												value={localizedDayjs(lease.move_in_date).format('LL')}
											/>
											<DetailField
												label="Move-out Date"
												value={localizedDayjs(lease.move_out_date).format('LL')}
											/>
											<DetailField
												label="Property Inspection"
												value={
													lease.property_inspection_date
														? localizedDayjs(
																lease.property_inspection_date,
															).format('LL')
														: '—'
												}
											/>
											<DetailField
												label="Utility Transfers"
												value={
													lease.utility_transfers_date
														? localizedDayjs(
																lease.utility_transfers_date,
															).format('LL')
														: '—'
												}
											/>
											<DetailField
												label="Activated At"
												value={
													lease.activated_at
														? localizedDayjs(lease.activated_at).format('LL')
														: '—'
												}
											/>
											{lease.cancelled_at && (
												<DetailField
													label="Cancelled At"
													value={localizedDayjs(lease.cancelled_at).format(
														'LL',
													)}
												/>
											)}
											{lease.terminated_at && (
												<DetailField
													label="Terminated At"
													value={localizedDayjs(lease.terminated_at).format(
														'LL',
													)}
												/>
											)}
											{lease.completed_at && (
												<DetailField
													label="Completed At"
													value={localizedDayjs(lease.completed_at).format(
														'LL',
													)}
												/>
											)}
										</div>
									</DetailPanel>

									{application && (
										<DetailPanel label="Financial terms">
											<div className="grid grid-cols-2 gap-4">
												<DetailField
													label="Rent Fee"
													value={
														application.rent_fee == null
															? '-'
															: formatAmount(
																	convertPesewasToCedis(application.rent_fee),
																	application.rent_fee_currency,
																)
													}
												/>
												{application.initial_deposit_fee != null && (
													<DetailField
														label="Initial Deposit"
														value={formatAmount(
															convertPesewasToCedis(
																application.initial_deposit_fee,
															),
															application.rent_fee_currency,
														)}
													/>
												)}
												{application.payment_frequency && (
													<DetailField
														label="Payment Frequency"
														value={getPaymentFrequencyLabel(
															application.payment_frequency,
														)}
													/>
												)}
												<DetailField
													label="Security Deposit"
													value={
														application.security_deposit_fee
															? formatAmount(
																	convertPesewasToCedis(
																		application.security_deposit_fee,
																	),
																	application.rent_fee_currency,
																)
															: '-'
													}
												/>
											</div>
											{application.financial_account && (
												<DocumentRow
													icon={<FileText className="size-[18px]" />}
													tone="blue"
													title="Financial account"
													subtitle={`${application.financial_account.code} · ${application.financial_account.invoice_count} ${application.financial_account.invoice_count === 1 ? 'invoice' : 'invoices'}`}
													to={`/properties/${propertyId}/financials/invoices`}
													actionLabel="Open"
												/>
											)}
										</DetailPanel>
									)}

									<DetailPanel label="Inspection reports">
										<div id="lease-checklist">
											<ChecklistSection
												leaseId={lease.id}
												canEdit={canEditChecklist}
												propertyId={propertyId}
											/>
										</div>
									</DetailPanel>
								</TabsContent>

								{/* Tenant Profile Tab */}
								<TabsContent value="tenant" className="mt-4 space-y-4">
									{tenant ? (
										<>
											<div className="flex items-center gap-4 rounded-xl border p-5">
												<Avatar className="size-14">
													<AvatarFallback className="text-primary bg-primary/10 text-lg font-semibold">
														{getInitials(tenantName ?? '?')}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className="font-serif text-xl">{tenantName}</p>
													<p className="text-muted-foreground mt-0.5 text-xs">
														{unit?.name ?? '—'}
													</p>
												</div>
											</div>

											<DetailPanel label="Personal Information">
												<div className="grid grid-cols-2 gap-4">
													<DetailField
														label="Full Name"
														value={`${tenant.first_name}${tenant.other_names ? ` ${tenant.other_names}` : ''} ${tenant.last_name}`}
													/>
													<DetailField label="Email" value={tenant.email} />
													<DetailField label="Phone" value={tenant.phone} />
													<DetailField
														label="Gender"
														value={toFirstUpperCase(tenant.gender)}
													/>
													<DetailField
														label="Date of Birth"
														value={localizedDayjs(tenant.date_of_birth).format(
															'LL',
														)}
													/>
													<DetailField
														label="Nationality"
														value={
															tenant.nationality
																? toFirstUpperCase(tenant.nationality)
																: '-'
														}
													/>
													<DetailField
														label="Marital Status"
														value={
															tenant.marital_status
																? toFirstUpperCase(tenant.marital_status)
																: '-'
														}
													/>
													<DetailField
														label="Current Address"
														value={tenant.current_address}
													/>
												</div>
											</DetailPanel>

											<DetailPanel label="Identification">
												<div className="grid grid-cols-2 gap-4">
													<DetailField
														label="ID Type"
														value={tenant.id_type?.replace(/_/g, ' ') ?? '—'}
													/>
													<DetailField
														label="ID Number"
														value={tenant.id_number}
													/>
													{tenant.id_front_url && (
														<DetailField
															label="ID Front"
															value={
																<a
																	href={tenant.id_front_url}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
																>
																	<ExternalLink className="size-3.5" />
																	View
																</a>
															}
														/>
													)}
													{tenant.id_back_url && (
														<DetailField
															label="ID Back"
															value={
																<a
																	href={tenant.id_back_url}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
																>
																	<ExternalLink className="size-3.5" />
																	View
																</a>
															}
														/>
													)}
												</div>
											</DetailPanel>

											<DetailPanel label="Employment">
												<div className="grid grid-cols-2 gap-4">
													<DetailField
														label="Employer Type"
														value={toFirstUpperCase(tenant.employer_type)}
													/>
													<DetailField
														label="Employer"
														value={tenant.employer}
													/>
													<DetailField
														label="Occupation"
														value={tenant.occupation}
													/>
													<DetailField
														label="Occupation Address"
														value={tenant.occupation_address}
													/>
													{tenant.proof_of_income_url && (
														<DetailField
															label="Proof of Income"
															value={
																<a
																	href={tenant.proof_of_income_url}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
																>
																	<ExternalLink className="size-3.5" />
																	View
																</a>
															}
														/>
													)}
												</div>
											</DetailPanel>

											<DetailPanel label="Emergency Contact">
												<div className="grid grid-cols-2 gap-4">
													<DetailField
														label="Name"
														value={tenant.emergency_contact_name}
													/>
													<DetailField
														label="Phone"
														value={tenant.emergency_contact_phone}
													/>
													<DetailField
														label="Relationship"
														value={
															tenant.relationship_to_emergency_contact
																? toFirstUpperCase(
																		tenant.relationship_to_emergency_contact,
																	)
																: '-'
														}
													/>
												</div>
											</DetailPanel>
										</>
									) : (
										<DetailPanel>
											<p className="text-muted-foreground text-sm">
												Tenant information not available.
											</p>
										</DetailPanel>
									)}
								</TabsContent>

								{/* Documents Tab */}
								<TabsContent value="documents" className="mt-4 space-y-4">
									<DetailPanel label="Lease Agreement">
										{lease.lease_agreement_document_url ? (
											<DocumentRow
												icon={<FileText className="size-[18px]" />}
												title="Lease Agreement"
												subtitle="Signed"
												href={lease.lease_agreement_document_url}
												actionLabel="View Document"
											/>
										) : (
											<LeaseAgreementDocumentSetup
												leaseId={lease.id}
												propertyId={propertyId}
												lease={lease}
												tenant={tenant}
												documentTemplates={documentTemplates}
												isManager={canEditChecklist}
											/>
										)}
									</DetailPanel>

									{lease.termination_agreement_document_url && (
										<DetailPanel label="Termination Agreement">
											<DocumentRow
												icon={<FileText className="size-[18px]" />}
												title="Termination Agreement"
												subtitle={`PM signed: ${
													lease.termination_agreement_document_property_manager_signed_at
														? localizedDayjs(
																lease.termination_agreement_document_property_manager_signed_at,
															).format('LL')
														: 'Not yet signed'
												} · Tenant signed: ${
													lease.termination_agreement_document_tenant_signed_at
														? localizedDayjs(
																lease.termination_agreement_document_tenant_signed_at,
															).format('LL')
														: 'Not yet signed'
												}`}
												href={lease.termination_agreement_document_url}
												actionLabel="View Document"
											/>
										</DetailPanel>
									)}
								</TabsContent>

								{/* Financials Tab */}
								<TabsContent value="financials" className="mt-4">
									<LeaseFinancialsTab
										lease={lease}
										clientId={clientId}
										propertyId={propertyId}
									/>
								</TabsContent>
							</Tabs>
						</div>
					</div>
				</div>
			</div>
			<StartLeaseDialog
				lease={lease}
				propertyId={propertyId}
				opened={startLeaseOpen}
				setOpened={setStartLeaseOpen}
			/>
		</>
	)
}
