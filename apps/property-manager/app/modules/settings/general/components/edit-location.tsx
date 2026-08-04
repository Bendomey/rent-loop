import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useClientMutation } from './use-client-mutation'
import {
	AddressInput,
	AddressSchema,
	type AddressInputSchema,
} from '~/components/address-input'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '~/components/ui/field'
import { Form } from '~/components/ui/form'
import { Spinner } from '~/components/ui/spinner'
import { safeString } from '~/lib/strings'

interface Props {
	client: Client
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
}

export function EditLocationDialog({
	client,
	open,
	onOpenChange,
	onSuccess,
}: Props) {
	const { submit, isPending } = useClientMutation(
		'Business location updated',
		onSuccess,
	)

	const rhf = useForm<AddressInputSchema>({
		resolver: zodResolver(AddressSchema),
		defaultValues: {
			addressSearch: safeString(client.address),
			address: safeString(client.address),
			city: safeString(client.city),
			region: safeString(client.region),
			country: safeString(client.country),
			latitude: client.latitude,
			longitude: client.longitude,
		},
	})

	const { formState } = rhf

	const isAddressInvalid =
		!!formState.errors.addressSearch ||
		!!formState.errors.address ||
		!!formState.errors.city ||
		!!formState.errors.region ||
		!!formState.errors.country ||
		!!formState.errors.latitude ||
		!!formState.errors.longitude

	const onSubmit = (data: AddressInputSchema) => {
		submit({
			clientId: client.id,
			address: data.address,
			city: data.city,
			region: data.region,
			country: data.country,
			latitude: data.latitude,
			longitude: data.longitude,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm rounded-xl">
				<DialogHeader>
					<DialogTitle>Edit business location</DialogTitle>
					<DialogDescription>
						Your official physical address. Used on invoices and lease
						documents.
					</DialogDescription>
				</DialogHeader>

				<Form {...rhf}>
					<form onSubmit={rhf.handleSubmit(onSubmit)} className="space-y-4">
						<FieldGroup>
							<Field data-invalid={isAddressInvalid}>
								<FieldLabel>Address</FieldLabel>
								<AddressInput />
								{isAddressInvalid && (
									<FieldError
										errors={[
											{ message: 'Kindly select a location from the list' },
										]}
									/>
								)}
							</Field>
						</FieldGroup>

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
								Save address
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
