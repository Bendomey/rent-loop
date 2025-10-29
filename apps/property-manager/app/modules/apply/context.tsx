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
	const [stepCount, setStepCount] = useState(0)
	const [formData, setFormData] = useState<
		Partial<CreateClientApplicationInput>
	>({})

	const goBack = () => setStepCount((prev) => (prev > 0 ? prev - 1 : prev))
	const goNext = () => setStepCount((prev) => prev + 1)

	const isDirty = Object.keys(formData).length > 0
	let blocker = useNavigationBlocker(isDirty)

	const updateFormData = (data: Partial<CreateClientApplicationInput>) => {
		setFormData((prev) => ({
			...prev,
			...data,
		}))
	}

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
