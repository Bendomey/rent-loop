import { createContext, useContext, useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { toast } from 'sonner'
import type { CreateClientApplicationInput } from '~/api/client-applications'
import { BlockNavigationDialog } from '~/components/block-navigation-dialog'
import { useNavigationBlocker } from '~/hooks/use-navigation-blocker'

interface ApplyContextType {
	stepCount: number
	goBack: () => void
	goNext: () => void
	updateFormData: (data: Partial<CreateClientApplicationInput>) => void
	formData: Partial<CreateClientApplicationInput>
	isSubmitting: boolean
	onSubmit: (data: Partial<CreateClientApplicationInput>) => Promise<void>
}

export const ApplyContext = createContext<ApplyContextType | undefined>(
	undefined,
)

export function ApplyProvider({ children }: { children: React.ReactNode }) {
	const applyFetcher = useFetcher<{ error: string; }>()
	const [stepCount, setStepCount] = useState(0)
	const [formData, setFormData] = useState<
		Partial<CreateClientApplicationInput>
	>({})

	const goBack = () => setStepCount((prev) => (prev > 0 ? prev - 1 : prev))
	const goNext = () => setStepCount((prev) => prev + 1)


	// where there is an error in the action data, show an error toast
	useEffect(() => {
		if (applyFetcher?.data?.error) {
			toast.error('Failed to fetch file')
		}
	}, [applyFetcher?.data])

	const isDirty = Object.keys(formData).length > 0
	const isSubmitting = applyFetcher.state !== "idle";

	let blocker = useNavigationBlocker(isSubmitting ? false : isDirty)

	const updateFormData = (data: Partial<CreateClientApplicationInput>) => {
		setFormData((prev) => ({
			...prev,
			...data,
		}))
	}

	const onSubmit = async (data: Partial<CreateClientApplicationInput>) => {
		await applyFetcher.submit(data, {
			method: 'POST',
			action: '/apply',
		})
	}

	const contextValue = {
		stepCount,
		goBack,
		goNext,
		updateFormData,
		formData,
		onSubmit,
		isSubmitting
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
