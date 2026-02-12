import { useOutletContext } from 'react-router'

interface UnitOutletContext {
	unit: PropertyUnit
}

export function useUnitContext() {
	return useOutletContext<UnitOutletContext>()
}
