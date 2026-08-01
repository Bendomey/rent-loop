import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { idTypeOptions, useClientMutation } from './use-client-mutation'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { ImageUpload } from '~/components/ui/image-upload'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { useUploadObject } from '~/hooks/use-upload-object'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'

const ValidationSchema = z.object({
	id_type: z
		.enum(['DRIVERS_LICENSE', 'PASSPORT', 'NATIONAL_ID'])
		.optional()
		.nullable(),
	id_number: z.string().optional().nullable(),
	id_expiry: z.date().optional().nullable(),
	id_document_url: z.string().optional().nullable(),
})

type FormSchema = z.infer<typeof ValidationSchema>

const startIdExpiryDate = localizedDayjs()
	.subtract(2, 'month')
	.startOf('day')
	.toDate()
const maxIdExpiryDate = localizedDayjs().add(20, 'year').toDate()

interface Props {
	client: Client
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
}

export function EditIdentityDialog({
	client,
	open,
	onOpenChange,
	onSuccess,
}: Props) {
	const { submit, isPending } = useClientMutation('Identity updated', onSuccess)

	const {
		upload,
		objectUrl,
		isLoading: isUploading,
	} = useUploadObject('property-owners/id-documents')

	const rhf = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			id_type: client.id_type ?? null,
			id_number: safeString(client.id_number) || null,
			id_expiry: client.id_expiry ? new Date(client.id_expiry) : null,
			id_document_url: safeString(client.id_document_url) || null,
		},
	})

	const { control, setValue, watch } = rhf

	useEffect(() => {
		if (objectUrl) {
			setValue('id_document_url', objectUrl, {
				shouldDirty: true,
				shouldValidate: true,
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [objectUrl])

	const onSubmit = (data: FormSchema) => {
		submit({
			clientId: client.id,
			id_type: data.id_type ?? null,
			id_number: data.id_number ?? null,
			id_expiry: data.id_expiry
				? localizedDayjs(data.id_expiry).format('YYYY-MM-DD')
				: null,
			id_document_url: data.id_document_url ?? null,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm rounded-xl">
				<DialogHeader>
					<DialogTitle>Edit identity</DialogTitle>
					<DialogDescription>
						Update your identity document details.
					</DialogDescription>
				</DialogHeader>

				<Form {...rhf}>
					<form onSubmit={rhf.handleSubmit(onSubmit)} className="space-y-4">
						<FormItem>
							<FormLabel>ID type</FormLabel>
							<div className="flex flex-wrap gap-2">
								{idTypeOptions.map((opt) => {
									const isSelected = watch('id_type') === opt.value
									return (
										<Button
											key={opt.value}
											type="button"
											variant={isSelected ? 'default' : 'outline'}
											size="sm"
											onClick={() =>
												setValue('id_type', isSelected ? null : opt.value, {
													shouldDirty: true,
													shouldValidate: true,
												})
											}
										>
											{opt.label}
										</Button>
									)
								})}
							</div>
						</FormItem>

						<FormField
							name="id_number"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>ID number</FormLabel>
									<FormControl>
										<Input
											{...field}
											value={field.value ?? ''}
											onChange={(e) => field.onChange(e.target.value || null)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="id_expiry"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>ID expiry</FormLabel>
									<FormControl>
										<DatePickerInput
											value={field.value ?? undefined}
											onChange={(date) => field.onChange(date ?? null)}
											disabled={(date) => date < startIdExpiryDate}
											startMonth={startIdExpiryDate}
											endMonth={maxIdExpiryDate}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<ImageUpload
							shape="square"
							hint="Optional"
							acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
							error={rhf.formState.errors?.id_document_url?.message}
							fileCallback={upload}
							isUploading={isUploading}
							dismissCallback={() => {
								setValue('id_document_url', null, {
									shouldDirty: true,
									shouldValidate: true,
								})
							}}
							imageSrc={safeString(watch('id_document_url'))}
							label="ID document"
							name="id_document"
							validation={{
								maxByteSize: 5120000, // 5MB
							}}
						/>

						<div className="flex justify-end gap-3 pt-1">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isPending} className="min-w-20">
								{isPending ? <Spinner /> : null}
								Save
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
