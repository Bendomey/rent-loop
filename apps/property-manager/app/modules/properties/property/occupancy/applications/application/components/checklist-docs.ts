import type { ChecklistItem } from './checklist-types'
import { getWitnessNodesFromContent } from '~/lib/document.utils'

export function getDocsItems(application: TenantApplication): ChecklistItem[] {
	const signatures = (
		application.lease_agreement_document_signatures ?? []
	).filter((s) => s.document_id === application.lease_agreement_document_id)

	const managerSig = signatures.find((s) => s.role === 'PROPERTY_MANAGER')
	const tenantSig = signatures.find((s) => s.role === 'TENANT')
	const pmWitnessSignatures = signatures.filter((s) => s.role === 'PM_WITNESS')
	const tenantWitnessSignatures = signatures.filter(
		(s) => s.role === 'TENANT_WITNESS',
	)

	const isManual = application.lease_agreement_document_mode === 'MANUAL'

	const witnessNodes = getWitnessNodesFromContent(
		application.lease_agreement_document?.content,
	)
	const pmWitnessCount = witnessNodes.filter(
		(n) => n.role === 'pm_witness',
	).length
	const tenantWitnessCount = witnessNodes.filter(
		(n) => n.role === 'tenant_witness',
	).length

	const witnessItems: ChecklistItem[] = witnessNodes.map((node, idx) => {
		const roleIdx = witnessNodes
			.slice(0, idx)
			.filter((n) => n.role === node.role).length
		const sig =
			node.role === 'pm_witness'
				? pmWitnessSignatures[roleIdx]
				: tenantWitnessSignatures[roleIdx]
		const showTag =
			node.role === 'pm_witness' ? pmWitnessCount > 1 : tenantWitnessCount > 1
		const label = showTag ? `${node.label} #${roleIdx + 1}` : node.label
		return { label: `${label} signed`, done: isManual || Boolean(sig) }
	})

	return [
		{
			label: 'Document uploaded',
			done:
				application.lease_agreement_document_mode === 'ONLINE'
					? Boolean(application.lease_agreement_document_id)
					: Boolean(application.lease_agreement_document_url),
		},
		{ label: 'Manager signed', done: isManual || Boolean(managerSig) },
		{ label: 'Tenant signed', done: isManual || Boolean(tenantSig) },
		...witnessItems,
	]
}
