import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, DoorOpen, Gavel, Handshake } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	useCreateLeaseTermination,
	useGetLeaseTermination,
	useUpdateLeaseTermination,
} from '~/api/lease-terminations'
import { Button } from '~/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

const schema = z.object({
	type: z.enum(['EVICTION', 'MUTUAL_AGREEMENT', 'TENANT_INITIATED'], {
		message: 'Select a termination type',
	}),
	reason: z.string().min(10, 'Reason must be at least 10 characters'),
})

type FormValues = z.infer<typeof schema>

const TYPE_OPTIONS: {
	value: LeaseTerminationType
	label: string
	description: string
	icon: React.ElementType
}[] = [
	{
		value: 'EVICTION',
		label: 'Eviction',
		description: 'Ending tenancy due to violations or non-payment.',
		icon: Gavel,
	},
	{
		value: 'MUTUAL_AGREEMENT',
		label: 'Mutual Agreement',
		description: 'Both parties agree to end the lease early.',
		icon: Handshake,
	},
	{
		value: 'TENANT_INITIATED',
		label: 'Tenant-Initiated',
		description: 'Tenant has given notice to vacate.',
		icon: DoorOpen,
	},
]

interface Props {
	lease: Lease
	propertyId: string
	terminationId: string | null
	onTerminationCreated: (id: string) => void
	onNext: () => void
}

export function StepReason({
	lease,
	propertyId,
	terminationId,
	onTerminationCreated,
	onNext,
}: Props) {
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)

	const { data: existingTermination } = useGetLeaseTermination(
		clientId,
		propertyId,
		lease.id,
		terminationId,
	)

	const { mutateAsync: create, isPending: isCreating } =
		useCreateLeaseTermination()
	const { mutateAsync: update, isPending: isUpdating } =
		useUpdateLeaseTermination()

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { type: undefined, reason: '' },
	})

	useEffect(() => {
		if (existingTermination) {
			form.reset({
				type: existingTermination.type ?? undefined,
				reason: existingTermination.reason ?? '',
			})
		}
	}, [existingTermination, form])

	const reason = form.watch('reason')

	const onSubmit = async (values: FormValues) => {
		try {
			if (terminationId) {
				await update({
					client_id: clientId,
					property_id: propertyId,
					lease_id: lease.id,
					termination_id: terminationId,
					type: values.type,
					reason: values.reason,
				})
			} else {
				const created = await create({
					client_id: clientId,
					property_id: propertyId,
					lease_id: lease.id,
					type: values.type,
					reason: values.reason,
				})
				if (created) onTerminationCreated(created.id)
			}
			onNext()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save reason')
		}
	}

	const isPending = isCreating || isUpdating

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<div className="flex flex-col gap-8 p-8">
					<div>
						<h2 className="text-base font-semibold">Reason &amp; Type</h2>
						<p className="text-muted-foreground mt-1 text-sm">
							Select the reason for termination and provide details. This is
							required to proceed.
						</p>
					</div>

					<FormField
						control={form.control}
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-sm font-medium">
									Termination Type
								</FormLabel>
								<div className="mt-2 grid grid-cols-3 gap-3">
									{TYPE_OPTIONS.map(
										({ value, label, description, icon: Icon }) => (
											<button
												key={value}
												type="button"
												onClick={() => field.onChange(value)}
												className={cn(
													'flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all',
													field.value === value
														? 'border-primary bg-primary/5 dark:bg-primary/10'
														: 'border-border hover:border-muted-foreground/40 hover:bg-muted/30',
												)}
											>
												<div
													className={cn(
														'flex h-9 w-9 items-center justify-center rounded-lg',
														field.value === value
															? 'bg-primary/10 text-primary'
															: 'bg-muted text-muted-foreground',
													)}
												>
													<Icon className="size-4" />
												</div>
												<div>
													<p className="text-sm font-semibold">{label}</p>
													<p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
														{description}
													</p>
												</div>
											</button>
										),
									)}
								</div>
								<FormMessage className="mt-2" />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="reason"
						render={({ field }) => (
							<FormItem>
								<div className="flex items-center justify-between">
									<FormLabel className="text-sm font-medium">
										Detailed Reason
									</FormLabel>
									<span className="text-muted-foreground text-xs">
										{reason.length} chars
									</span>
								</div>
								<FormControl>
									<Textarea
										{...field}
										placeholder="Describe the reason for termination in detail — include relevant dates, incidents, or agreements…"
										rows={6}
										className="mt-1.5 resize-none"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex items-center justify-end border-t px-8 py-4">
					<Button type="submit" disabled={isPending}>
						{isPending ? <Spinner /> : null}
						Save &amp; Continue
						<ArrowRight className="size-4" />
					</Button>
				</div>
			</form>
		</Form>
	)
}
