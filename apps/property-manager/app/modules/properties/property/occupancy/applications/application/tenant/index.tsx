import { useRouteLoaderData } from 'react-router'
import { getTenantDetailItems } from '../components/checklist-tenant-details'
import { requiredItems } from '../components/checklist-types'
import { StepPageHeader, type StepPill } from '../components/step-page-header'
import { PropertyTenantApplicationBasic } from './basic'
import { PropertyTenantApplicationEmergencyContact } from './emergency-contact'
import { PropertyTenantApplicationIdentity } from './identity'
import { pronounsFor } from '~/lib/pronouns'
import { safeString } from '~/lib/strings'
import type { loader } from '~/routes/_auth.properties.$propertyId.occupancy.applications.$applicationId'

export function PropertyTenantApplicationTenant() {
	// Every step is a direct child of `$applicationId` now — the `_step` layout
	// that used to hand the application down through an outlet context is gone —
	// so the page reads the parent route's loader itself.
	const loaderData = useRouteLoaderData<Awaited<ReturnType<typeof loader>>>(
		'routes/_auth.properties.$propertyId.occupancy.applications.$applicationId',
	)
	const application = loaderData?.tenantApplication
	const clientUserProperty = loaderData?.clientUserProperty

	if (!application) {
		return (
			<div className="m-5 flex items-center justify-center">
				<p className="text-muted-foreground text-sm">
					Lease application not found.
				</p>
			</div>
		)
	}

	const propertyId = safeString(clientUserProperty?.property_id)
	const baseUrl = `/properties/${propertyId}/occupancy/applications/${application.id}`
	const pronouns = pronounsFor(application.gender)
	const applicantName = application.first_name ?? 'the applicant'

	// The same condition each card uses to refuse edits: once the agreement is
	// signed — or is out for signing — the details it names cannot move.
	const locked = ['SIGNED', 'SIGNING'].includes(
		safeString(application.lease_agreement_document_status),
	)
	const done = requiredItems(getTenantDetailItems(application)).every(
		(item) => item.done,
	)

	const { title, subtitle, pill, pillTone } = ((): {
		title: string
		subtitle: string
		pill: string
		pillTone: StepPill
	} => {
		if (locked)
			return {
				title: `${applicantName}’s details`,
				subtitle: `The agreement has been signed, so ${pronouns.possessive} details are settled now.`,
				pill: 'Fixed',
				pillTone: 'fixed',
			}
		if (done)
			return {
				title: `${applicantName}’s details`,
				subtitle: `Everything the lease needs about ${pronouns.object} is here. Edit any card to change it.`,
				pill: 'Done',
				pillTone: 'done',
			}
		return {
			title: `Who is ${applicantName}?`,
			subtitle: `The lease and ${pronouns.possessive} tenant record are written from these details.`,
			pill: 'Step 2 of 5',
			pillTone: 'step',
		}
	})()

	return (
		<div className="m-5">
			<StepPageHeader
				title={title}
				subtitle={subtitle}
				pill={pill}
				pillTone={pillTone}
				backHref={baseUrl}
				nextHref={done ? `${baseUrl}/move-in` : undefined}
				nextLabel={done ? 'Next: move-in dates' : undefined}
			/>

			<div className="space-y-3">
				<PropertyTenantApplicationBasic
					property_id={propertyId}
					application={application}
				/>
				<PropertyTenantApplicationIdentity
					property_id={propertyId}
					application={application}
				/>
				<PropertyTenantApplicationEmergencyContact
					property_id={propertyId}
					application={application}
				/>
			</div>
		</div>
	)
}
