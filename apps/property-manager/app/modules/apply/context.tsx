import { createContext, useContext, useState } from 'react'
import type { CreateClientApplicationInput } from '~/api/client-applications'
import { BlockNavigationDialog } from '~/components/block-navigation-dialog'
import { useNavigationBlocker } from '~/hooks/use-navigation-blocker'

interface ApplyContextType {
	stepCount: number
	goBack: () => void
	goNext: () => void
	updateFormData: (data: Partial<CreateClientApplicationInput>) => void
	formData: Partial<CreateClientApplicationInput>
}

export const ApplyContext = createContext<ApplyContextType | undefined>(
	undefined,
)

export function ApplyProvider({ children }: { children: React.ReactNode }) {
	const [formData, setFormData] = useState<
		Partial<CreateClientApplicationInput>
	>({})
	const [stepCount, setStepCount] = useState(0)

	const isFormDirty = Object.keys(formData).length > 0

	const goBack = () => setStepCount((prev) => (prev > 0 ? prev - 1 : prev))
	const goNext = () => setStepCount((prev) => prev + 1)

	const updateFormData = (data: Partial<CreateClientApplicationInput>) => {
		setFormData((prev) => ({ ...prev, ...data }))
	}

	let blocker = useNavigationBlocker(isFormDirty)

	const contextValue = {
		stepCount,
		goBack,
		goNext,
		updateFormData,
		formData,
	}

	return (
		<ApplyContext.Provider value={contextValue}>
			{children}
			<BlockNavigationDialog blocker={blocker} />
		</ApplyContext.Provider>
	)
}

export function useApplyContext() {
	const context = useContext(ApplyContext)

	if (!context) {
		throw new Error('useApplyContext must be used within an ApplyProvider')
	}

	return context
}
