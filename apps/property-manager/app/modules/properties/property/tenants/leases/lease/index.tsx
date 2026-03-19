import {
	CalendarDays,
	ExternalLink,
	FileText,
	HouseIcon,
	ScrollText,
	User,
} from 'lucide-react'
import { Link, useLoaderData } from 'react-router'
import { ChecklistAlerts } from './components/checklist-alerts'
import { ChecklistSection } from './components/checklist-section'
import { Image } from '~/components/Image'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { useHasPropertyPermissions } from '~/components/permissions/use-has-role'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { TypographyMuted } from '~/components/ui/typography'
import { PermissionState } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { getLeaseStatusClass, getLeaseStatusLabel } from '~/lib/lease.utils'
import {
	getPaymentFrequencyLabel,
	getPaymentFrequencyPeriodLabel,
} from '~/lib/properties.utils'
import { toFirstUpperCase } from '~/lib/strings'
import { useProperty } from '~/providers/property-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.tenants.leases.$leaseId'

function DetailRow({
	label,
	value,
}: {
	label: string
	value: React.ReactNode
}) {
	return (
		<div className="flex flex-col gap-0.5">
			<TypographyMuted className="text-xs">{label}</TypographyMuted>
			<div className="text-sm font-medium">{value ?? '—'}</div>
		</div>
	)
}

function SectionHeading({ children }: { children: React.ReactNode }) {
	return (
		<>
			<p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
				{children}
			</p>
			<Separator />
		</>
	)
}

export function LeaseDetailModule() {
	const { lease, clientUserProperty } = useLoaderData<typeof loader>()
	const { clientUserProperty: ctxProp } = useProperty()
	const { hasPermissions: managerPermission } = useHasPropertyPermissions({
		roles: ['MANAGER'],
	})

	const propertyId =
		clientUserProperty?.property_id ?? ctxProp?.property_id ?? ''

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
	const isTerminable =
		lease.status === 'Lease.Status.Active' ||
		lease.status === 'Lease.Status.Pending'
	const canEditChecklist = managerPermission === PermissionState.AUTHORIZED

	return (
		<div className="mx-auto flex max-w-6xl flex-col">
			<ChecklistAlerts
				lease={lease}
				canEdit={canEditChecklist}
				propertyId={propertyId}
			/>
			<div className="m-5 grid grid-cols-12 gap-6">
				{/* Sidebar */}
				<div className="col-span-12 lg:col-span-4">
					<Card className="overflow-hidden pt-0 shadow-none">
						{unit?.images?.[0] && (
							<div className="h-40 w-full overflow-hidden">
								<Image
									src={unit.images[0]}
									alt={unit.name}
									className="h-full w-full object-cover"
								/>
							</div>
						)}
						<CardHeader className="flex items-start justify-between gap-2">
							<div className="flex items-center gap-2">
								<ScrollText className="text-muted-foreground size-5" />
								<CardTitle className="text-base">{lease.code}</CardTitle>
							</div>
							<Badge
								variant="outline"
								className={`px-2 py-0.5 text-xs ${getLeaseStatusClass(lease.status)}`}
							>
								{getLeaseStatusLabel(lease.status)}
							</Badge>
						</CardHeader>

						<CardContent className="space-y-4 text-sm">
							{/* Tenant */}
							<div className="flex items-center gap-2">
								<User className="text-muted-foreground size-4 shrink-0" />
								{tenant ? (
									<Link
										to={`/properties/${propertyId}/tenants/all/${tenant.id}`}
										className="text-blue-600 hover:underline"
									>
										{tenant.first_name} {tenant.last_name}
									</Link>
								) : (
									<span className="text-muted-foreground">—</span>
								)}
							</div>

							{/* Unit */}
							<div className="flex items-center gap-2">
								<HouseIcon className="text-muted-foreground size-4 shrink-0" />
								{unit ? (
									<Link
										to={`/properties/${propertyId}/assets/units/${unit.id}`}
										className="text-blue-600 hover:underline"
									>
										{unit.name}
									</Link>
								) : (
									<span className="text-muted-foreground">—</span>
								)}
							</div>

							<Separator />

							{/* Rent */}
							<div className="space-y-0.5">
								<TypographyMuted className="text-xs">Rent Fee</TypographyMuted>
								<p className="text-2xl font-semibold">
									{formatAmount(convertPesewasToCedis(lease.rent_fee))}
								</p>
								<TypographyMuted className="text-xs">
									{getPaymentFrequencyLabel(lease.payment_frequency ?? '')}
								</TypographyMuted>
							</div>

							<Separator />

							{/* Created On */}
							<div className="flex items-center gap-2">
								<CalendarDays className="text-muted-foreground size-4 shrink-0" />
								<div>
									<TypographyMuted className="text-xs">
										Created On
									</TypographyMuted>
									<p className="text-sm">
										{localizedDayjs(lease.created_at).format('LL')}
									</p>
								</div>
							</div>

							{/* Updated On */}
							<div className="flex items-center gap-2">
								<CalendarDays className="text-muted-foreground size-4 shrink-0" />
								<div>
									<TypographyMuted className="text-xs">
										Updated On
									</TypographyMuted>
									<p className="text-sm">
										{localizedDayjs(lease.updated_at).format('LL')}
									</p>
								</div>
							</div>

							{/* Application link */}
							{application && (
								<>
									<Separator />
									<Link
										to={`/properties/${propertyId}/tenants/applications/${application.id}`}
										className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
									>
										<ExternalLink className="size-3.5" />
										View Application ({application.code})
									</Link>
								</>
							)}
						</CardContent>

						<CardFooter className="flex justify-end gap-2 border-t pt-4">
							<PropertyPermissionGuard roles={['MANAGER']}>
								{isTerminable && (
									<Button variant="destructive" size="sm" disabled>
										Terminate Lease
									</Button>
								)}
							</PropertyPermissionGuard>
						</CardFooter>
					</Card>
				</div>

				{/* Main Content */}
				<div className="col-span-12 lg:col-span-8">
					<Tabs defaultValue="details">
						<TabsList>
							<TabsTrigger value="details">Lease Details</TabsTrigger>
							<TabsTrigger value="tenant">Tenant Profile</TabsTrigger>
							<TabsTrigger value="documents">Documents</TabsTrigger>
						</TabsList>

						{/* Details Tab */}
						<TabsContent value="details" className="mt-4 space-y-4">
							{/* Lease Terms + Financial Terms */}
							<Card className="shadow-none">
								<CardContent className="space-y-6">
									{/* Lease Terms */}
									<div className="space-y-3">
										<SectionHeading>Lease Terms</SectionHeading>
										<div className="grid grid-cols-2 gap-4">
											<DetailRow
												label="Payment Frequency"
												value={
													getPaymentFrequencyLabel(
														lease.payment_frequency ?? '',
													) || '—'
												}
											/>
											<DetailRow
												label="Duration"
												value={`${lease.stay_duration} ${getPaymentFrequencyPeriodLabel(lease.stay_duration_frequency, lease.stay_duration)}`}
											/>
											<DetailRow
												label="Move-in Date"
												value={localizedDayjs(lease.move_in_date).format('LL')}
											/>
											<DetailRow
												label="Property Inspection"
												value={
													lease.property_inspection_date
														? localizedDayjs(
																lease.property_inspection_date,
															).format('LL')
														: '—'
												}
											/>
											<DetailRow
												label="Utility Transfers"
												value={
													lease.utility_transfers_date
														? localizedDayjs(
																lease.utility_transfers_date,
															).format('LL')
														: '—'
												}
											/>
											<DetailRow
												label="Activated At"
												value={
													lease.activated_at
														? localizedDayjs(lease.activated_at).format('LL')
														: '—'
												}
											/>
											{lease.cancelled_at && (
												<DetailRow
													label="Cancelled At"
													value={localizedDayjs(lease.cancelled_at).format(
														'LL',
													)}
												/>
											)}
											{lease.terminated_at && (
												<DetailRow
													label="Terminated At"
													value={localizedDayjs(lease.terminated_at).format(
														'LL',
													)}
												/>
											)}
											{lease.completed_at && (
												<DetailRow
													label="Completed At"
													value={localizedDayjs(lease.completed_at).format(
														'LL',
													)}
												/>
											)}
										</div>
									</div>

									{/* Financial Terms */}
									{application && (
										<div className="space-y-3">
											<SectionHeading>Financial Terms</SectionHeading>
											<div className="grid grid-cols-2 gap-4">
												<DetailRow
													label="Rent Fee"
													value={formatAmount(
														convertPesewasToCedis(application.rent_fee),
													)}
												/>
												{application.initial_deposit_fee != null && (
													<DetailRow
														label="Initial Deposit"
														value={formatAmount(
															convertPesewasToCedis(
																application.initial_deposit_fee,
															),
														)}
													/>
												)}
												{application.payment_frequency && (
													<DetailRow
														label="Payment Frequency"
														value={getPaymentFrequencyLabel(
															application.payment_frequency,
														)}
													/>
												)}
												<DetailRow
													label="Security Deposit"
													value={
														application.security_deposit_fee
															? formatAmount(
																	convertPesewasToCedis(
																		application.security_deposit_fee,
																	),
																)
															: '-'
													}
												/>
												{application.application_payment_invoice && (
													<div className="flex flex-col gap-0.5">
														<TypographyMuted className="text-xs">
															Invoice
														</TypographyMuted>
														<Link
															to={`/properties/${propertyId}/financials/invoices/${application.application_payment_invoice.id}`}
															className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
														>
															<FileText className="size-3.5" />
															{application.application_payment_invoice.code}
														</Link>
													</div>
												)}
											</div>
										</div>
									)}
								</CardContent>
							</Card>

							{/* Inspection Reports — separate card */}
							<Card className="shadow-none">
								<CardContent>
									<ChecklistSection
										leaseId={lease.id}
										canEdit={canEditChecklist}
										propertyId={propertyId}
									/>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Tenant Profile Tab */}
						<TabsContent value="tenant" className="mt-4">
							<Card className="shadow-none">
								<CardContent className="space-y-6">
									{tenant ? (
										<>
											{/* Personal Info */}
											<div className="space-y-3">
												<SectionHeading>Personal Information</SectionHeading>
												<div className="grid grid-cols-2 gap-4">
													<DetailRow
														label="Full Name"
														value={`${tenant.first_name}${tenant.other_names ? ` ${tenant.other_names}` : ''} ${tenant.last_name}`}
													/>
													<DetailRow label="Email" value={tenant.email} />
													<DetailRow label="Phone" value={tenant.phone} />
													<DetailRow
														label="Gender"
														value={toFirstUpperCase(tenant.gender)}
													/>
													<DetailRow
														label="Date of Birth"
														value={localizedDayjs(tenant.date_of_birth).format(
															'LL',
														)}
													/>
													<DetailRow
														label="Nationality"
														value={toFirstUpperCase(tenant.nationality)}
													/>
													<DetailRow
														label="Marital Status"
														value={toFirstUpperCase(tenant.marital_status)}
													/>
													<DetailRow
														label="Current Address"
														value={tenant.current_address}
													/>
												</div>
											</div>

											{/* ID Information */}
											<div className="space-y-3">
												<SectionHeading>Identification</SectionHeading>
												<div className="grid grid-cols-2 gap-4">
													<DetailRow
														label="ID Type"
														value={tenant.id_type?.replace(/_/g, ' ') ?? '—'}
													/>
													<DetailRow
														label="ID Number"
														value={tenant.id_number}
													/>
													{tenant.id_front_url && (
														<div className="flex flex-col gap-0.5">
															<TypographyMuted className="text-xs">
																ID Front
															</TypographyMuted>
															<a
																href={tenant.id_front_url}
																target="_blank"
																rel="noopener noreferrer"
																className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
															>
																<ExternalLink className="size-3.5" />
																View
															</a>
														</div>
													)}
													{tenant.id_back_url && (
														<div className="flex flex-col gap-0.5">
															<TypographyMuted className="text-xs">
																ID Back
															</TypographyMuted>
															<a
																href={tenant.id_back_url}
																target="_blank"
																rel="noopener noreferrer"
																className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
															>
																<ExternalLink className="size-3.5" />
																View
															</a>
														</div>
													)}
												</div>
											</div>

											{/* Employment */}
											<div className="space-y-3">
												<SectionHeading>Employment</SectionHeading>
												<div className="grid grid-cols-2 gap-4">
													<DetailRow
														label="Employer Type"
														value={toFirstUpperCase(tenant.employer_type)}
													/>
													<DetailRow label="Employer" value={tenant.employer} />
													<DetailRow
														label="Occupation"
														value={tenant.occupation}
													/>
													<DetailRow
														label="Occupation Address"
														value={tenant.occupation_address}
													/>
													{tenant.proof_of_income_url && (
														<div className="flex flex-col gap-0.5">
															<TypographyMuted className="text-xs">
																Proof of Income
															</TypographyMuted>
															<a
																href={tenant.proof_of_income_url}
																target="_blank"
																rel="noopener noreferrer"
																className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
															>
																<ExternalLink className="size-3.5" />
																View
															</a>
														</div>
													)}
												</div>
											</div>

											{/* Emergency Contact */}
											<div className="space-y-3">
												<SectionHeading>Emergency Contact</SectionHeading>
												<div className="grid grid-cols-2 gap-4">
													<DetailRow
														label="Name"
														value={tenant.emergency_contact_name}
													/>
													<DetailRow
														label="Phone"
														value={tenant.emergency_contact_phone}
													/>
													<DetailRow
														label="Relationship"
														value={toFirstUpperCase(
															tenant.relationship_to_emergency_contact,
														)}
													/>
												</div>
											</div>

											{/* Previous Tenancy */}
											{(tenant.previous_landlord_name ||
												tenant.previous_landlord_phone ||
												tenant.previous_tenancy_period) && (
												<div className="space-y-3">
													<SectionHeading>Previous Tenancy</SectionHeading>
													<div className="grid grid-cols-2 gap-4">
														<DetailRow
															label="Previous Landlord"
															value={tenant.previous_landlord_name}
														/>
														<DetailRow
															label="Landlord Phone"
															value={tenant.previous_landlord_phone}
														/>
														<DetailRow
															label="Tenancy Period"
															value={tenant.previous_tenancy_period}
														/>
													</div>
												</div>
											)}
										</>
									) : (
										<p className="text-muted-foreground text-sm">
											Tenant information not available.
										</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* Documents Tab */}
						<TabsContent value="documents" className="mt-4">
							<Card className="shadow-none">
								<CardContent className="space-y-6">
									{/* Lease Agreement */}
									<div className="space-y-3">
										<SectionHeading>Lease Agreement</SectionHeading>
										{lease.lease_agreement_document_url ? (
											<div className="space-y-4 text-sm">
												<a
													href={lease.lease_agreement_document_url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-1 text-blue-600 hover:underline"
												>
													<ExternalLink className="size-3.5" />
													View Document
												</a>
												{application?.lease_agreement_document_signatures &&
												application.lease_agreement_document_signatures.length >
													0 ? (
													<div className="space-y-2">
														{(
															[
																'PROPERTY_MANAGER',
																'TENANT',
																'PM_WITNESS',
																'TENANT_WITNESS',
															] as const
														).map((role) => {
															const sig =
																application.lease_agreement_document_signatures.find(
																	(s) => s.role === role,
																)
															const roleLabel: Record<typeof role, string> = {
																PROPERTY_MANAGER: 'Property Manager',
																TENANT: 'Tenant',
																PM_WITNESS: 'PM Witness',
																TENANT_WITNESS: 'Tenant Witness',
															}
															return (
																<div
																	key={role}
																	className="flex items-center justify-between rounded-md border px-3 py-2"
																>
																	<div>
																		<p className="text-xs font-medium">
																			{roleLabel[role]}
																		</p>
																		{sig?.signed_by_name && (
																			<p className="text-muted-foreground text-xs">
																				{sig.signed_by_name}
																			</p>
																		)}
																	</div>
																	{sig ? (
																		<div className="flex items-center gap-2">
																			<Badge
																				variant="outline"
																				className="bg-teal-500 px-1.5 text-white"
																			>
																				Signed{' '}
																				{localizedDayjs(sig.created_at).format(
																					'LL',
																				)}
																			</Badge>
																		</div>
																	) : (
																		<Badge
																			variant="outline"
																			className="bg-zinc-400 px-1.5 text-white"
																		>
																			Not signed
																		</Badge>
																	)}
																</div>
															)
														})}
													</div>
												) : (
													<p className="text-muted-foreground text-xs">
														No signature records available.
													</p>
												)}
											</div>
										) : (
											<p className="text-muted-foreground text-sm">N/A</p>
										)}
									</div>

									{/* Termination Agreement */}
									<div className="space-y-3">
										<SectionHeading>Termination Agreement</SectionHeading>
										{lease.termination_agreement_document_url ? (
											<div className="space-y-2 text-sm">
												<a
													href={lease.termination_agreement_document_url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-1 text-blue-600 hover:underline"
												>
													<ExternalLink className="size-3.5" />
													View Document
												</a>
												<div className="text-muted-foreground space-y-1 text-xs">
													<p>
														PM signed:{' '}
														{lease.termination_agreement_document_property_manager_signed_at
															? localizedDayjs(
																	lease.termination_agreement_document_property_manager_signed_at,
																).format('LL')
															: 'Not yet signed'}
													</p>
													<p>
														Tenant signed:{' '}
														{lease.termination_agreement_document_tenant_signed_at
															? localizedDayjs(
																	lease.termination_agreement_document_tenant_signed_at,
																).format('LL')
															: 'Not yet signed'}
													</p>
												</div>
											</div>
										) : (
											<p className="text-muted-foreground text-sm">N/A</p>
										)}
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	)
}
