import { createContext, useContext, useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { toast } from 'sonner'
import type { CreatePropertyTenantApplicationInput } from '~/api/tenant-applications'
import { BlockNavigationDialog } from '~/components/block-navigation-dialog'
import { useNavigationBlocker } from '~/hooks/use-navigation-blocker'

interface TenantApplicationContextType {
	stepCount: number
	goToPage: (page: number) => void
	goBack: () => void
	goNext: () => void
	updateFormData: (data: Partial<CreatePropertyTenantApplicationInput>) => void
	formData: Partial<CreatePropertyTenantApplicationInput>
	isSubmitting: boolean
	onSubmit: (
		data: Partial<CreatePropertyTenantApplicationInput>,
	) => Promise<void>
}

export const TenantApplicationContext = createContext<
	TenantApplicationContextType | undefined
>(undefined)

export function CreateNewPropertyTenantApplicationProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const createFetcher = useFetcher<{ error: string }>()
	const [stepCount, setStepCount] = useState(0)
	const [formData, setFormData] = useState<
		Partial<CreatePropertyTenantApplicationInput>
	>({})

	const goBack = () => setStepCount((prev) => (prev > 0 ? prev - 1 : prev))
	const goNext = () => setStepCount((prev) => prev + 1)
	const goToPage = (page: number) => setStepCount(page)

	// where there is an error in the action data, show an error toast
	useEffect(() => {
		if (createFetcher?.data?.error) {
			toast.error('Failed to submit tenant application. Please try again.')
		}
	}, [createFetcher?.data])

	const isDirty = Object.keys(formData).length > 0
	const isSubmitting = createFetcher.state !== 'idle'

	let blocker = useNavigationBlocker(isSubmitting ? false : isDirty)

	const updateFormData = (
		data: Partial<CreatePropertyTenantApplicationInput>,
	) => {
		setFormData((prev) => ({
			...prev,
			...data,
		}))
	}

	const onSubmit = async (
		data: Partial<CreatePropertyTenantApplicationInput>,
	) => {
		const updatedData = { ...data }

		if (formData.phone) {
			updatedData.phone = `+233${formData.phone.slice(-9)}`
		}

		if (formData.emergency_contact_phone) {
			updatedData.emergency_contact_phone = `+233${formData.emergency_contact_phone.slice(-9)}`
		}

		await createFetcher.submit(updatedData, {
			method: 'POST',
			action: `/properties/${formData.property_id}/tenants/applications/new`,
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
		<TenantApplicationContext.Provider value={contextValue}>
			{children}
			<BlockNavigationDialog blocker={blocker} />
		</TenantApplicationContext.Provider>
	)
}

export function useTenantApplicationContext() {
	const context = useContext(TenantApplicationContext)

	if (!context) {
		throw new Error(
			'useTenantApplicationContext must be used within an TenantApplicationContextProvider',
		)
	}

	return context
}
