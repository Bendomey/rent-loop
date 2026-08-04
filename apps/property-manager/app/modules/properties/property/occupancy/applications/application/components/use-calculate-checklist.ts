import { getDocsItems } from './checklist-docs'
import { getFinancialItems } from './checklist-financial'
import { getMoveInItems } from './checklist-move-in'
import { getTenantDetailItems } from './checklist-tenant-details'
import { getUnitItems } from './checklist-unit'

export function useCalculateChecklist(application: TenantApplication) {
	const unitItems = getUnitItems(application)
	const tenantDetailItems = getTenantDetailItems(application)
	const moveInItems = getMoveInItems(application)
	const financialItems = getFinancialItems(application)
	const docsItems = getDocsItems(application)

	const checklistSections = [
		unitItems,
		tenantDetailItems,
		moveInItems,
		financialItems,
		docsItems,
	]
	// Display progress: all 5 sections, empty sections count as incomplete.
	const sectionsComplete = checklistSections.filter(
		(items) => items.length > 0 && items.every((i) => i.done),
	).length
	const progress = (sectionsComplete / checklistSections.length) * 100

	// Approval gate: only sections that have items (docs is optional when unset).
	const requiredSections = checklistSections.filter((items) => items.length > 0)
	const canApprove =
		requiredSections.length === 0 ||
		requiredSections.every((items) => items.every((i) => i.done))

	return {
		progress,
		canApprove,
		unitItems,
		tenantDetailItems,
		moveInItems,
		financialItems,
		docsItems,
	}
}
