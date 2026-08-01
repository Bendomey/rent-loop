import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { subTypeOptions, useClientMutation } from './use-client-mutation'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Form, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Spinner } from '~/components/ui/spinner'

const ValidationSchema = z.object({
	sub_type: z.enum(['PROPERTY_MANAGER', 'DEVELOPER', 'AGENCY'], {
		error: 'Please select a business type',
	}),
})

type FormSchema = z.infer<typeof ValidationSchema>

interface Props {
	client: Client
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
}

export function EditBusinessTypeDialog({
	client,
	open,
	onOpenChange,
	onSuccess,
}: Props) {
	const { submit, isPending } = useClientMutation(
		'Business type updated',
		onSuccess,
	)

	const currentSubType =
		client.sub_type !== 'LANDLORD'
			? (client.sub_type as FormSchema['sub_type'])
			: undefined

	const rhf = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: { sub_type: currentSubType },
	})

	const { watch, setValue } = rhf

	const onSubmit = (data: FormSchema) => {
		submit({ clientId: client.id, sub_type: data.sub_type })
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm rounded-xl">
				<DialogHeader>
					<DialogTitle>Change business type</DialogTitle>
					<DialogDescription>
						How your company is described on tenant-facing pages.
					</DialogDescription>
				</DialogHeader>

				<Form {...rhf}>
					<form onSubmit={rhf.handleSubmit(onSubmit)} className="space-y-4">
						<FormItem>
							<FormLabel>Business type</FormLabel>
							<div className="flex flex-wrap gap-2">
								{subTypeOptions.map((opt) => (
									<Button
										key={opt.value}
										type="button"
										variant={
											watch('sub_type') === opt.value ? 'default' : 'outline'
										}
										size="sm"
										onClick={() =>
											setValue('sub_type', opt.value, {
												shouldDirty: true,
												shouldValidate: true,
											})
										}
									>
										{opt.label}
									</Button>
								))}
							</div>
							<FormMessage>
								{rhf.formState.errors.sub_type?.message}
							</FormMessage>
						</FormItem>

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
