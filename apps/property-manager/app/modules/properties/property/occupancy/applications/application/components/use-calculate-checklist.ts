import { getDocsItems } from './checklist-docs'
import type { ChecklistItem } from './checklist-types'
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
	// A section is complete once its REQUIRED items are done. Optional items —
	// collecting the first payment, say — show their state without holding the
	// step back.
	const isComplete = (items: ChecklistItem[]) =>
		items.length > 0 && items.every((item) => item.optional || item.done)

	// Display progress: all 5 sections, empty sections count as incomplete.
	const sectionsComplete = checklistSections.filter(isComplete).length
	const progress = (sectionsComplete / checklistSections.length) * 100

	// Approval gate: only sections that have items (docs is optional when unset).
	const requiredSections = checklistSections.filter((items) => items.length > 0)
	const canApprove =
		requiredSections.length === 0 || requiredSections.every(isComplete)

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
