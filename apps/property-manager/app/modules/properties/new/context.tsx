import { createContext, useContext, useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { toast } from 'sonner'
import type { CreatePropertyInput } from '~/api/property'
import { BlockNavigationDialog } from '~/components/block-navigation-dialog'
import { useNavigationBlocker } from '~/hooks/use-navigation-blocker'

interface CreateNewPropertyContextType {
	stepCount: number
	goToPage: (page: number) => void
	goBack: () => void
	goNext: () => void
	updateFormData: (data: Partial<CreatePropertyInput>) => void
	formData: Partial<CreatePropertyInput>
	isSubmitting: boolean
	onSubmit: (data: Partial<CreatePropertyInput>) => Promise<void>
}

export const CreatePropertyContext = createContext<
	CreateNewPropertyContextType | undefined
>(undefined)

export function CreatePropertyProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const createFetcher = useFetcher<{ error: string }>()
	const [stepCount, setStepCount] = useState(0)
	const [formData, setFormData] = useState<Partial<CreatePropertyInput>>({})

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

	const updateFormData = (data: Partial<CreatePropertyInput>) => {
		setFormData((prev) => ({
			...prev,
			...data,
		}))
	}

	const onSubmit = async (data: Partial<CreatePropertyInput>) => {
		const updatedData = { ...data }

		await createFetcher.submit(updatedData, {
			method: 'POST',
			action: '/properties/new',
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
		<CreatePropertyContext.Provider value={contextValue}>
			{children}
			<BlockNavigationDialog blocker={blocker} />
		</CreatePropertyContext.Provider>
	)
}

export function useCreatePropertyContext() {
	const context = useContext(CreatePropertyContext)

	if (!context) {
		throw new Error(
			'useCreatePropertyContext must be used within an CreatePropertyProvider',
		)
	}

	return context
}
