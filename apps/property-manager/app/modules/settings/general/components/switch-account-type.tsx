import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftRight } from 'lucide-react'
import { useEffect, useState } from 'react'
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

/**
 * What actually changes when the account flips type. Spelled out before the
 * user commits, because switching drops details we can no longer collect.
 */
const CONSEQUENCES = {
	Individual: [
		'Company details are replaced by your personal details',
		'Registration number is no longer collected',
		'Existing leases and invoices keep the name they were issued under',
	],
	Company: [
		'Your identity document details are no longer collected',
		'We start collecting company details and a registration number',
		'Existing leases and invoices keep the name they were issued under',
	],
}

function SwitchNote() {
	return (
		<div className="rounded-lg border border-amber-500/25 bg-amber-500/8 p-3.5 text-[13px] leading-relaxed text-amber-900 dark:bg-amber-400/10 dark:text-amber-200">
			You can switch back at any time, but you&rsquo;ll need to re-enter the
			details for whichever type you choose.
		</div>
	)
}

const toCompanySchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	sub_type: z.enum(['PROPERTY_MANAGER', 'DEVELOPER', 'AGENCY'], {
		error: 'Please select a business type',
	}),
	description: z.string().max(500, 'Max 500 characters').optional(),
	registration_number: z.string().optional(),
	support_email: z.string().email('Invalid email').optional().or(z.literal('')),
	support_phone: z.string().optional(),
	website_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type ToCompanySchema = z.infer<typeof toCompanySchema>

function SwitchToCompanyForm({
	client,
	onSuccess,
	onCancel,
}: {
	client: Client
	onSuccess: () => void
	onCancel: () => void
}) {
	const { submit, isPending } = useClientMutation(
		'Account type updated to Company',
		onSuccess,
	)

	const rhf = useForm<ToCompanySchema>({
		resolver: zodResolver(toCompanySchema),
		defaultValues: { name: client.name },
	})

	const { control, watch, setValue } = rhf

	const onSubmit = (data: ToCompanySchema) => {
		submit({
			clientId: client.id,
			type: 'COMPANY',
			sub_type: data.sub_type,
			name: data.name,
			description: data.description || null,
			registration_number: data.registration_number || null,
			support_email: data.support_email || null,
			support_phone: data.support_phone || null,
			website_url: data.website_url || null,
		})
	}

	return (
		<Form {...rhf}>
			<form onSubmit={rhf.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					name="name"
					control={control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Company name</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

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
					<FormMessage>{rhf.formState.errors.sub_type?.message}</FormMessage>
				</FormItem>

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
							<FormDescription>Optional</FormDescription>
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
									<Input type="email" {...field} />
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
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending} className="min-w-30">
						{isPending ? <Spinner /> : null}
						Switch to Company
					</Button>
				</div>
			</form>
		</Form>
	)
}

const toIndividualSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
})

type ToIndividualSchema = z.infer<typeof toIndividualSchema>

function SwitchToIndividualForm({
	client,
	onSuccess,
	onCancel,
}: {
	client: Client
	onSuccess: () => void
	onCancel: () => void
}) {
	const { submit, isPending } = useClientMutation(
		'Account type updated to Individual',
		onSuccess,
	)

	const rhf = useForm<ToIndividualSchema>({
		resolver: zodResolver(toIndividualSchema),
		defaultValues: { name: client.name },
	})

	const onSubmit = (data: ToIndividualSchema) => {
		submit({
			clientId: client.id,
			type: 'INDIVIDUAL',
			sub_type: 'LANDLORD',
			name: data.name,
		})
	}

	return (
		<Form {...rhf}>
			<form onSubmit={rhf.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					name="name"
					control={rhf.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Full name</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="flex justify-end gap-3 pt-1">
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel
					</Button>
					<Button type="submit" disabled={isPending} className="min-w-35">
						{isPending ? <Spinner /> : null}
						Switch to Individual
					</Button>
				</div>
			</form>
		</Form>
	)
}

interface Props {
	client: Client
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess: () => void
}

/**
 * Two steps in one dialog: spell out what changes, then collect the details
 * the new account type needs.
 */
export function SwitchAccountTypeDialog({
	client,
	open,
	onOpenChange,
	onSuccess,
}: Props) {
	const [step, setStep] = useState<'confirm' | 'form'>('confirm')

	const isCompany = client.type === 'COMPANY'
	const target = isCompany ? 'Individual' : 'Company'

	// Always reopen on the explanation, never mid-flow.
	useEffect(() => {
		if (open) setStep('confirm')
	}, [open])

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg rounded-xl">
				<DialogHeader>
					<div className="flex items-center gap-2">
						<ArrowLeftRight className="size-5" />
						<DialogTitle>
							{step === 'confirm'
								? `Switch to ${target}?`
								: `Switch to ${target}`}
						</DialogTitle>
					</div>
					<DialogDescription>
						{step === 'confirm' ? (
							<>
								This account currently bills as a{' '}
								<span className="text-foreground font-medium">
									{isCompany ? 'Company' : 'Individual'}
								</span>
								. Switching changes what details we collect and how documents
								are addressed.
							</>
						) : (
							'Fill in the details for your new account type. Common fields have been pre-filled.'
						)}
					</DialogDescription>
				</DialogHeader>

				{step === 'confirm' ? (
					<div className="space-y-4">
						<div className="rounded-lg border p-4">
							<div className="mb-2 text-sm font-semibold">What changes</div>
							<ul className="space-y-1.5">
								{CONSEQUENCES[target].map((line) => (
									<li
										key={line}
										className="text-muted-foreground flex gap-2.5 text-[13px] leading-relaxed"
									>
										<span aria-hidden>&bull;</span>
										<span>{line}</span>
									</li>
								))}
							</ul>
						</div>

						<SwitchNote />

						<div className="flex justify-end gap-3 pt-1">
							<Button variant="outline" onClick={() => onOpenChange(false)}>
								Cancel
							</Button>
							<Button onClick={() => setStep('form')}>
								Switch to {target}
							</Button>
						</div>
					</div>
				) : isCompany ? (
					<SwitchToIndividualForm
						client={client}
						onSuccess={onSuccess}
						onCancel={() => onOpenChange(false)}
					/>
				) : (
					<SwitchToCompanyForm
						client={client}
						onSuccess={onSuccess}
						onCancel={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	)
}
