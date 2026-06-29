import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, DoorOpen, FileX, Gavel, Handshake } from 'lucide-react'
import { type Dispatch, type SetStateAction } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCreateLeaseTermination } from '~/api/lease-terminations'
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
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { useNavigate } from 'react-router'

const schema = z.object({
	type: z.enum(['EVICTION', 'MUTUAL_AGREEMENT', 'TENANT_INITIATED'], {
		message: 'Select a termination type',
	}),
	reason: z.string().min(10, 'Reason must be at least 10 characters'),
})

type FormSchema = z.infer<typeof schema>

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
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	propertyId: string
}

export function TerminateLeaseModal({
	lease,
	propertyId,
	opened,
	setOpened,
}: Props) {
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const navigate = useNavigate()

	const { mutate, isPending } = useCreateLeaseTermination()

	const form = useForm<FormSchema>({
		resolver: zodResolver(schema),
		defaultValues: { type: undefined, reason: '' },
	})

	const reason = form.watch('reason')

	const onSubmit = (formData: FormSchema) => {
		if (formData) {
			mutate(
				{
					client_id: clientId,
					property_id: propertyId,
					lease_id: lease.id,
					type: formData.type,
					reason: formData.reason,
				},
				{
					onError: () => {
						toast.error(`Failed to terminate lease. Try again later.`)
					},
					onSuccess: (res) => {
						toast.success(
							`Reason saved — complete the remaining steps to finalise the termination.`,
						)

						setTimeout(() => {
							void navigate(
								`/properties/${propertyId}/occupancy/leases/${lease.id}/terminate/${res?.id}`,
							)
						}, 1000)
						setOpened(false)
					},
				},
			)
		}
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
				<AlertDialogHeader className="border-b px-6 py-5">
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-center gap-3">
							<div className="bg-destructive/10 flex h-9 w-9 items-center justify-center rounded-lg">
								<FileX className="text-destructive size-4" />
							</div>
							<div>
								<AlertDialogTitle className="text-base leading-none font-medium">
									Terminate lease
								</AlertDialogTitle>
								<AlertDialogDescription className="text-muted-foreground mt-1 text-sm">
									{lease.code} — complete each step to finalise
								</AlertDialogDescription>
							</div>
						</div>
					</div>
				</AlertDialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
						<div className="flex flex-col gap-8 p-8">
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

						<div className="flex flex-col-reverse justify-between border-t px-6 py-4 md:flex-row md:justify-between">
							<Button
								variant="outline"
								disabled={isPending}
								type="button"
								onClick={(e) => {
									e.preventDefault()
									setOpened(false)
								}}
								className="w-full md:w-auto"
							>
								Cancel
							</Button>

							<Button
								type="submit"
								disabled={isPending}
								className="w-full md:w-auto"
							>
								{isPending ? <Spinner /> : null}
								Save &amp; Continue
								<ArrowRight className="size-4" />
							</Button>
						</div>
					</form>
				</Form>
			</AlertDialogContent>
		</AlertDialog>
	)
}
