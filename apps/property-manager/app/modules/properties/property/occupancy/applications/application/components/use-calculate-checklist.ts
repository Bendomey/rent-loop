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
	const sectionsComplete = checklistSections.filter((items) =>
		items.every((i) => i.done),
	).length

	const progress = (sectionsComplete / checklistSections.length) * 100

	return {
		progress,
		unitItems,
		tenantDetailItems,
		moveInItems,
		financialItems,
		docsItems,
	}
}
