import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useClientMutation } from './use-client-mutation'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { FieldGroup } from '~/components/ui/field'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import { safeString } from '~/lib/strings'

const ValidationSchema = z.object({
	description: z.string().max(500, 'Max 500 characters').optional(),
	registration_number: z.string().optional(),
	support_email: z.string().email('Invalid email').optional().or(z.literal('')),
	support_phone: z.string().optional(),
	website_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type FormSchema = z.infer<typeof ValidationSchema>

interface Props {
	client: Client
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
}

export function EditCompanyDetailsDialog({
	client,
	open,
	onOpenChange,
	onSuccess,
}: Props) {
	const { submit, isPending } = useClientMutation(
		'Company details updated',
		onSuccess,
	)

	const rhf = useForm<FormSchema>({
		resolver: zodResolver(ValidationSchema),
		defaultValues: {
			description: safeString(client.description),
			registration_number: safeString(client.registration_number),
			support_email: safeString(client.support_email),
			support_phone: safeString(client.support_phone),
			website_url: safeString(client.website_url),
		},
	})

	const { control } = rhf

	const onSubmit = (data: FormSchema) => {
		submit({
			clientId: client.id,
			// Send null to clear a field when the user leaves it blank
			description: data.description || null,
			registration_number: data.registration_number || null,
			support_email: data.support_email || null,
			support_phone: data.support_phone || null,
			website_url: data.website_url || null,
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg rounded-xl">
				<DialogHeader>
					<DialogTitle>Edit company details</DialogTitle>
					<DialogDescription>
						Support details are shown to tenants when they need to reach you.
						Leave a field blank to clear its value.
					</DialogDescription>
				</DialogHeader>

				<Form {...rhf}>
					<form onSubmit={rhf.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							name="description"
							control={control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="What your company does…"
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Optional. Appears on the tenant portal.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<FormField
								name="registration_number"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Registration number</FormLabel>
										<FormControl>
											<Input placeholder="e.g. CS123456789" {...field} />
										</FormControl>
										<FormDescription>Optional</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="support_email"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Support email</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="support@example.com"
												{...field}
											/>
										</FormControl>
										<FormDescription>Optional</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="support_phone"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Support phone</FormLabel>
										<FormControl>
											<Input placeholder="+233…" {...field} />
										</FormControl>
										<FormDescription>Optional</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								name="website_url"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>Website</FormLabel>
										<FormControl>
											<Input placeholder="https://example.com" {...field} />
										</FormControl>
										<FormDescription>Optional</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
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
								Save details
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
