import { zodResolver } from '@hookform/resolvers/zod'
import { createContext, useContext, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import z from 'zod'
import { BlockNavigationDialog } from '~/components/block-navigation-dialog'
import { useNavigationBlocker } from '~/hooks/use-navigation-blocker'

const ValidationSchema = z
	.object({
		// first step
		type: z.enum(['INDIVIDUAL', 'COMPANY'], {
			error: 'Please select a type',
		}),
		sub_type: z
			.enum(['LANDLORD', 'PROPERTY_MANAGER', 'DEVELOPER', 'AGENCY'], {
				error: 'Please select a sub type',
			})
			.optional()
			.nullable(),

		// second step
		name: z.string({ error: 'Name is required' }).min(2, 'Please enter a valid name'),
		description: z
			.string()
			.max(500, 'Description must be less than 500 characters')
			.optional(),
		registration_number: z
			.string()
			.min(2, 'Please enter a valid registration number')
			.optional(),
		support_email: z.email('Please enter a valid support email address').optional(),
		support_phone: z
			.string()
			.min(9, 'Please enter a valid support phone number').optional(),
		website_url: z.url('Please enter a valid website URL').optional(),
		contact_name: z.string().min(2, 'Please enter a valid name').optional(),
		date_of_birth: z
			.date()
			.refine((date) => {
				const today = new Date()
				const age = today.getFullYear() - date.getFullYear()
				return age >= 18
			}, 'You must be at least 18 years old')
			.optional(),
		id_type: z
			.enum(['DRIVERS_LICENSE', 'PASSPORT', 'NATIONAL_ID'], {
				error: 'Please select an ID type',
			})
			.optional(),
		id_number: z.string().min(2, 'Please enter a valid ID number').optional(),
		id_expiry: z
			.date()
			.refine((date) => {
				const today = new Date()
				return date > today
			}, 'ID has expired')
			.optional(),

		// third step
		address: z.string({ error: "Address is required" }).min(5, 'Please enter a valid address'),
		city: z.string({ error: "City is required" }).min(2, 'Please enter a valid address'),
		region: z.string({ error: "Region is required" }).min(2, 'Please enter a valid address'),
		country: z.string({ error: "Country is required" }).min(2, 'Please enter a valid address'),
		latitude: z.number().refine((val) => !isNaN(val), {
			message: 'Please enter a valid latitude',
		}),
		longitude: z.number().refine((val) => !isNaN(val), {
			message: 'Please enter a valid longitude',
		}),

		// fourth step
		contact_email: z.email('Please enter a valid email address'),
		contact_phone_number: z
			.string({ error: 'Contact phone number is required' })
			.min(9, 'Please enter a valid phone number'),
	})
	.superRefine((data, ctx) => {
		if (data.type === 'COMPANY') {
			if (!data.sub_type || data.sub_type === 'LANDLORD') {
				ctx.addIssue({
					code: 'custom',
					message: 'Please select a sub type',
					path: ['sub_type'],
				})
			}

			if(!data.contact_name){
				ctx.addIssue({
					code: 'custom',
					message: 'Please enter contact name',
					path: ['contact_name'],
				})
			}
		}

		if (data.type === 'INDIVIDUAL') {
			// individual specific validations
			if (!data.date_of_birth) {
				ctx.addIssue({
					code: 'custom',
					message: 'Please enter your date of birth',
					path: ['date_of_birth'],
				})
			}

			if (!data.id_type) {
				ctx.addIssue({
					code: 'custom',
					message: 'Please select an ID type',
					path: ['id_type'],
				})
			}

			if (!data.id_number) {
				ctx.addIssue({
					code: 'custom',
					message: 'Please enter your ID number',
					path: ['id_number'],
				})
			}

			if (!data.id_expiry) {
				ctx.addIssue({
					code: 'custom',
					message: 'Please enter your ID expiry date',
					path: ['id_expiry'],
				})
			}
		}
	})

export type FormSchema = z.infer<typeof ValidationSchema>

interface ApplyContextType {
	stepCount: number
	goBack: () => void
	goNext: () => void
}

export const ApplyContext = createContext<ApplyContextType | undefined>(
	undefined,
)

export function ApplyProvider({ children }: { children: React.ReactNode }) {
	const [stepCount, setStepCount] = useState(0)

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
	})

	const goBack = () => setStepCount((prev) => (prev > 0 ? prev - 1 : prev))
	const goNext = () => setStepCount((prev) => prev + 1)

	let blocker = useNavigationBlocker(rhfMethods.formState.isDirty)

	const contextValue = {
		stepCount,
		goBack,
		goNext,
	}

	return (
		<FormProvider {...rhfMethods}>
			<ApplyContext.Provider value={contextValue}>
				{children}
				<BlockNavigationDialog blocker={blocker} />
			</ApplyContext.Provider>
		</FormProvider>
	)
}

export function useApplyContext() {
	const context = useContext(ApplyContext)

	if (!context) {
		throw new Error('useApplyContext must be used within an ApplyProvider')
	}

	return context
}
