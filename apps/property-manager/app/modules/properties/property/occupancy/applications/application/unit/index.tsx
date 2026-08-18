import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useRevalidator, useRouteLoaderData } from 'react-router'
import { toast } from 'sonner'
import { StepPageHeader, type StepPill } from '../components/step-page-header'
import { ChosenUnit } from './chosen-unit'
import { UnitPicker } from './unit-picker'
import { WhatThisDecides } from './what-this-decides'
import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { useGetPropertyUnits } from '~/api/units'
import { Spinner } from '~/components/ui/spinner'
import { QUERY_KEYS } from '~/lib/constants'
import { capitalise, hasHave, isAre, pronounsFor } from '~/lib/pronouns'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.occupancy.applications.$applicationId'

export function PropertyTenantApplicationUnitSetup() {
	// Every step carries its own header and rail, so this page reads the parent
	// route's loader directly rather than taking the application from a layout.
	const loaderData = useRouteLoaderData<Awaited<ReturnType<typeof loader>>>(
		'routes/_auth.properties.$propertyId.occupancy.applications.$applicationId',
	)
	const application = loaderData?.tenantApplication
	const clientUserProperty = loaderData?.clientUserProperty

	const { clientUser } = useClient()
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()
	const [choosing, setChoosing] = useState(false)

	const clientId = safeString(clientUser?.client_id)
	const propertyId = safeString(clientUserProperty?.property_id)
	const unit = application?.desired_unit
	const pronouns = pronounsFor(application?.gender)
	const applicantName = application?.first_name ?? 'the applicant'
	const baseUrl = `/properties/${propertyId}/occupancy/applications/${application?.id}`

	// U6 — a single-unit property has nothing to choose between.
	const isSingleProperty = clientUserProperty?.property?.type === 'SINGLE'

	// U3 — read the server's own flag. `total_settled > 0` is account-wide, so
	// it blocked on a paid deposit the service would have allowed, and stayed
	// open when rent was invoiced-but-unpaid, which the service refuses.
	const rentTermsLocked = Boolean(
		application?.financial_account?.rent_terms_locked,
	)
	// U4 — a signed agreement names the unit.
	const isDocSigned = ['SIGNED', 'SIGNING'].includes(
		safeString(application?.lease_agreement_document_status),
	)
	const isLocked = rentTermsLocked || isDocSigned
	const lockReason = rentTermsLocked
		? 'Rent has already been billed on this application. Void or refund those bills before changing the unit.'
		: 'The lease agreement has been signed, so the unit can no longer change.'

	const inProgress =
		application?.status === 'TenantApplication.Status.InProgress'
	// The same condition that puts the overview's unit step into attention.
	const conflict = Boolean(
		inProgress && unit?.status === 'Unit.Status.Occupied',
	)

	const { data, isPending: loadingUnits } = useGetPropertyUnits(clientId, {
		property_id: propertyId,
		sorter: { sort: 'desc', sort_by: 'created_at' },
		pagination: { per: 1000 },
	})

	const { isPending: saving, mutate } = useAdminUpdateTenantApplication()

	const save = (unitId: string, rentMinor: Nullable<number>) => {
		const next = data?.rows.find((row) => row.id === unitId)

		mutate(
			{
				client_id: clientId,
				id: safeString(application?.id),
				property_id: propertyId,
				data: {
					desired_unit_id: unitId,
					// U1/U2 — currency and frequency are properties of the unit and
					// follow it. Rent is not: it is the figure the lease is written
					// against, so it carries over unless the landlord says otherwise.
					rent_fee: rentMinor == null ? next?.rent_fee : rentMinor,
					rent_fee_currency: next?.rent_fee_currency,
					payment_frequency: next?.payment_frequency,
					stay_duration_frequency: next?.payment_frequency,
				},
			},
			{
				onError: () => toast.error('Failed to change unit. Try again later.'),
				onSuccess: () => {
					toast.success('Unit has been updated successfully.')
					setChoosing(false)
					// U7 — the schedule is rebuilt server-side, so everything derived
					// from it has to be refetched.
					void revalidator.revalidate()
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.PROPERTY_TENANT_APPLICATIONS],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.FINANCIAL_ACCOUNT],
					})
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.INVOICES],
					})
				},
			},
		)
	}

	if (!application) {
		return (
			<div className="m-5 flex items-center justify-center">
				<p className="text-muted-foreground text-sm">
					Lease application not found.
				</p>
			</div>
		)
	}

	// U6 — on a single-unit property there is nothing to change to, so the
	// picker is never reachable even when nothing is locked.
	const canChange = !isSingleProperty && inProgress && !isLocked
	// Choosing when told to, when nothing is chosen yet, or when what was
	// chosen can no longer be honoured.
	const picking = canChange && (choosing || !unit || conflict)

	const { title, subtitle, pill, pillTone } = ((): {
		title: string
		subtitle: string
		pill: string
		pillTone: StepPill
	} => {
		if (picking)
			return {
				title: `Which unit is ${applicantName} taking?`,
				subtitle: unit
					? `You’re swapping ${pronouns.object} out of ${unit.name}. Pick the new one.`
					: `Pick one and we’ll use it for ${pronouns.possessive} rent, ${pronouns.possessive} dates and ${pronouns.possessive} lease papers.`,
				pill: 'Step 1 of 5',
				pillTone: 'step',
			}
		if (conflict)
			return {
				title: `${unit?.name ?? 'The unit'} is gone`,
				subtitle: `Someone else took it while ${pronouns.possessive} application was open.`,
				pill: 'Needs you',
				pillTone: 'attention',
			}
		if (isLocked)
			return {
				title: `${applicantName}’s unit`,
				subtitle: `${capitalise(pronouns.subject)} ${hasHave(pronouns)} paid against this unit, so it’s settled now.`,
				pill: 'Fixed',
				pillTone: 'fixed',
			}
		return {
			title: `${applicantName}’s unit`,
			subtitle: `This is the unit ${pronouns.possessive} application is for.${canChange ? ' You can still swap it.' : ''}`,
			pill: 'Done',
			pillTone: 'done',
		}
	})()

	const settled = Boolean(unit) && !picking && !conflict

	return (
		<div className="m-5">
			<StepPageHeader
				title={title}
				subtitle={subtitle}
				pill={pill}
				pillTone={pillTone}
				backHref={baseUrl}
				nextHref={settled ? `${baseUrl}/tenant-details` : undefined}
				nextLabel={
					settled
						? `Next: who ${pronouns.subject} ${isAre(pronouns)}`
						: undefined
				}
			/>

			{picking && loadingUnits ? (
				<div className="flex justify-center py-20">
					<Spinner />
				</div>
			) : (
				<div className="grid grid-cols-12 gap-6">
					<div className="col-span-12 lg:col-span-8">
						{picking ? (
							<UnitPicker
								units={data?.rows ?? []}
								currentUnitId={unit?.id}
								currentRent={application.rent_fee ?? null}
								applicantName={applicantName}
								pronouns={pronouns}
								chargeCount={application.financial_account?.charge_count ?? 0}
								saving={saving}
								onCancel={
									unit && !conflict ? () => setChoosing(false) : undefined
								}
								onConfirm={save}
							/>
						) : unit ? (
							<ChosenUnit
								unit={unit}
								state={isLocked ? 'locked' : conflict ? 'conflict' : 'chosen'}
								applicantName={applicantName}
								pronouns={pronouns}
								lockReason={lockReason}
								unitHref={`/properties/${propertyId}/assets/units/${unit.id}`}
								canChange={canChange}
								onChange={() => setChoosing(true)}
							/>
						) : (
							<p className="text-muted-foreground py-20 text-center text-sm">
								No unit has been assigned to this application yet.
							</p>
						)}
					</div>

					<div className="col-span-12 lg:col-span-4">
						<WhatThisDecides
							unit={unit ?? null}
							pronouns={pronouns}
							propertyName={
								clientUserProperty?.property?.name ?? 'this property'
							}
							addUnitHref={
								picking
									? `/properties/${propertyId}/assets/units/new`
									: undefined
							}
						/>
					</div>
				</div>
			)}
		</div>
	)
}
