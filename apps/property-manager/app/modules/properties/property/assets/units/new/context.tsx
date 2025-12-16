import { createContext, useContext, useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { toast } from 'sonner'
import type { CreatePropertyUnitInput } from '~/api/units'
import { BlockNavigationDialog } from '~/components/block-navigation-dialog'
import { useNavigationBlocker } from '~/hooks/use-navigation-blocker'

interface CreateNewPropertyUnitContextType {
	stepCount: number
	goToPage: (page: number) => void
	goBack: () => void
	goNext: () => void
	updateFormData: (data: Partial<CreatePropertyUnitInput>) => void
	formData: Partial<CreatePropertyUnitInput>
	isSubmitting: boolean
	onSubmit: (data: Partial<CreatePropertyUnitInput>) => Promise<void>
}

export const CreatePropertyUnitContext = createContext<
	CreateNewPropertyUnitContextType | undefined
>(undefined)

export function CreatePropertyUnitProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const createFetcher = useFetcher<{ error: string }>()
	const [stepCount, setStepCount] = useState(0)
	const [formData, setFormData] = useState<Partial<CreatePropertyUnitInput>>({})

	const goBack = () => setStepCount((prev) => (prev > 0 ? prev - 1 : prev))
	const goNext = () => setStepCount((prev) => prev + 1)
	const goToPage = (page: number) => setStepCount(page)

	// where there is an error in the action data, show an error toast
	useEffect(() => {
		if (createFetcher?.data?.error) {
			toast.error('Failed to fetch file')
		}
	}, [createFetcher?.data])

	const isDirty = Object.keys(formData).length > 0
	const isSubmitting = createFetcher.state !== 'idle'

	let blocker = useNavigationBlocker(isSubmitting ? false : isDirty)

	const updateFormData = (data: Partial<CreatePropertyUnitInput>) => {
		setFormData((prev) => ({
			...prev,
			...data,
		}))
	}

	const onSubmit = async (data: Partial<CreatePropertyUnitInput>) => {
		const updatedData = { ...data }

		await createFetcher.submit(updatedData, {
			method: 'POST',
			action: `/properties/${updatedData.property_id}/assets/units/new`,
		})
	}

	const contextValue = {
		stepCount,
		goBack,
		goToPage,
		goNext,
		updateFormData,
		formData,
		onSubmit,
		isSubmitting,
	}

	return (
		<CreatePropertyUnitContext.Provider value={contextValue}>
			{children}
			<BlockNavigationDialog blocker={blocker} />
		</CreatePropertyUnitContext.Provider>
	)
}

export function useCreatePropertyUnitContext() {
	const context = useContext(CreatePropertyUnitContext)

	if (!context) {
		throw new Error(
			'useCreatePropertyUnitContext must be used within an CreatePropertyUnitProvider',
		)
	}

	return context
}
