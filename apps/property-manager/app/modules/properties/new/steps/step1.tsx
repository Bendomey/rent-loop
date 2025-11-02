import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useCreatePropertyContext } from '../context'
import { PropertyTagInput } from '~/components/property-tag'
import { Button } from '~/components/ui/button'
import { FieldGroup } from '~/components/ui/field'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

const ValidationSchema = z.object({
	name: z
		.string({ error: 'Name is required' })
		.min(2, 'Please enter a valid name'),
	description: z
		.string()
		.max(500, 'Description must be less than 500 characters')
		.optional(),
	tags: z.array(z.string().min(1).max(10)).optional(),
})

export type FormSchema = z.infer<typeof ValidationSchema>

export function Step1() {
	const [tags, setTags] = useState<string[]>([])

	const { goBack, goNext, formData, updateFormData } =
		useCreatePropertyContext()
	const rhfMethods = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
	})

	const { handleSubmit, control, setValue } = rhfMethods

	useEffect(() => {
		if (formData.name) {
			setValue('name', formData.name, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}

		if (formData.description) {
			setValue('description', formData.description, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		if (formData.tags) {
			setTags(formData.tags)
			setValue('tags', formData.tags, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const onSubmit = async (data: FormSchema) => {
		updateFormData({
			name: data.name,
			description: data.description,
			tags: tags,
		})
		goNext()
	}

	return (
		<Form {...rhfMethods}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto mb-5 space-y-10 md:max-w-2/3"
			>
				<div className="space-y-2">
					<TypographyH2 className="">Basic Information</TypographyH2>
					<TypographyMuted className=""></TypographyMuted>
				</div>

				<FieldGroup>
					<FormField
						name="name"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input type="text" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						name="description"
						control={control}
						render={({ field }) => (
							<FormItem>
								<FormLabel>Property Details</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Briefly describe your property (e.g., size, features, or highlights)..."
										rows={5}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<PropertyTagInput value={tags} onChange={setTags} />
				</FieldGroup>

				<div className="mt-10 flex items-center justify-end space-x-5">
					<Button onClick={goBack} type="button" size="sm" variant="ghost">
						<ArrowLeft />
						Go Back
					</Button>
					<Button
						size="lg"
						variant="default"
						className="bg-rose-600 hover:bg-rose-700"
					>
						Next
					</Button>
				</div>
			</form>
		</Form>
	)
}
