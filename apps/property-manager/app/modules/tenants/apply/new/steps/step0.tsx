import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useRouteLoaderData } from 'react-router'
import { z } from 'zod'
import { UnitPreview } from '../../components/unit-preview'
import { useTenantApplicationContext } from '../context'
import { Button } from '~/components/ui/button'
import { Form } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import type { loader } from '~/routes/tenants.apply'

const ValidationSchema = z.object({
	desired_unit_id: z.string({
		error: 'Invalid referral code',
	}),
	created_by_id: z.string({
		error: 'Invalid referral code',
	}),
})

export type FormSchema = z.infer<typeof ValidationSchema>

export function Step0() {
	const parentData = useRouteLoaderData<typeof loader>('routes/tenants.apply')
	const { referredBy, unitId, unit } = parentData || {
		referredBy: null,
		unitId: null,
	}

	const { goNext, formData, updateFormData } = useTenantApplicationContext()

	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			created_by_id: formData.created_by_id || referredBy || undefined,
			desired_unit_id: formData.desired_unit_id || unitId || undefined,
		},
	})

	const { handleSubmit } = rhfMethods

	const onSubmit = async (data: FormSchema) => {
		updateFormData({
			desired_unit_id: data.desired_unit_id,
			created_by_id: data.created_by_id,
		})
		goNext()
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto my-4 space-y-6 md:my-8 md:max-w-2xl"
			>
				<Input type="hidden" {...rhfMethods.register('created_by_id')} />
				<Input type="hidden" {...rhfMethods.register('desired_unit_id')} />

				{/* Header Section */}
				<div className="space-y-1 border-b pb-6 md:space-y-3">
					<TypographyH2 className="text-3xl font-bold">
						Unit Overview
					</TypographyH2>
					<TypographyMuted className="text-base leading-relaxed">
						Review the property unit you're applying for
					</TypographyMuted>
				</div>

				<UnitPreview unit={unit} />

				{/* Action Buttons */}
				<div className="flex flex-col-reverse gap-3 border-t pt-6 md:flex-row md:justify-between">
					<Link to={`/tenants/apply?unit=${unitId}&referred_by=${referredBy}`}>
						<Button
							type="button"
							size="lg"
							variant="outline"
							className="w-full md:w-auto"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Go Back
						</Button>
					</Link>
					<Button
						size="lg"
						variant="default"
						className="w-full bg-rose-600 hover:bg-rose-700 md:w-auto"
					>
						Next <ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</form>
		</Form>
	)
}
