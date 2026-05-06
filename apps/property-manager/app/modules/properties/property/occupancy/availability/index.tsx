import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	useCreateDateBlock,
	useDeleteDateBlock,
	useGetUnitAvailability,
} from '~/api/bookings'
import { useGetPropertyUnits } from '~/api/units'
import { DatePickerInput } from '~/components/date-picker-input'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '~/components/ui/sheet'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

const blockSchema = z
	.object({
		unit_id: z.string().min(1, 'Select a unit'),
		block_type: z.enum(['MAINTENANCE', 'PERSONAL', 'OTHER'], {
			error: 'Select a block type',
		}),
		start_date: z.date({ error: 'Start date required' }),
		end_date: z.date({ error: 'End date required' }),
		reason: z.string().optional(),
	})
	.refine((d) => d.end_date >= d.start_date, {
		message: 'End date must be on or after start date',
		path: ['end_date'],
	})

type BlockForm = z.infer<typeof blockSchema>

type BlockTypeConfig = {
	label: string
	color: string
	darkColor: string
}

const BLOCK_TYPE_CONFIG: Record<string, BlockTypeConfig> = {
	BOOKING: { label: 'Booking', color: '#3b82f6', darkColor: '#2563eb' },
	LEASE: { label: 'Lease', color: '#8b5cf6', darkColor: '#7c3aed' },
	MAINTENANCE: { label: 'Maintenance', color: '#f59e0b', darkColor: '#d97706' },
	PERSONAL: { label: 'Personal', color: '#6b7280', darkColor: '#4b5563' },
	OTHER: { label: 'Other', color: '#6b7280', darkColor: '#4b5563' },
}

function blocksToModifiers(
	blocks: UnitDateBlock[] | undefined,
): Record<string, Date[]> {
	if (!blocks) return {}
	const map: Record<string, Date[]> = {}
	for (const block of blocks) {
		const type = block.block_type
		if (!map[type]) map[type] = []
		// expand range into individual days
		const start = localizedDayjs(block.start_date)
		const end = localizedDayjs(block.end_date)
		let cur = start
		while (cur.isSame(end) || cur.isBefore(end)) {
			map[type].push(cur.toDate())
			cur = cur.add(1, 'day')
		}
	}
	return map
}

export function AvailabilityModule() {
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const queryClient = useQueryClient()

	const propertyId = clientUserProperty?.property_id ?? ''
	const clientId = safeString(clientUser?.client_id)

	const [currentMonth, setCurrentMonth] = useState(new Date())
	const [selectedUnitId, setSelectedUnitId] = useState<string>('')
	const [sheetOpen, setSheetOpen] = useState(false)
	const [selectedBlock, setSelectedBlock] = useState<UnitDateBlock | null>(null)

	const { data: unitsData } = useGetPropertyUnits(clientId, {
		property_id: propertyId,
		pagination: { per: 100 },
		filters: {},
	})
	const units = unitsData?.rows ?? []

	const rangeFrom = dayjs(currentMonth).startOf('month').toDate()
	const rangeTo = dayjs(currentMonth).endOf('month').toDate()

	const { data: blocks, isPending: isLoadingBlocks } = useGetUnitAvailability(
		clientId,
		propertyId,
		selectedUnitId,
		rangeFrom,
		rangeTo,
	)

	const modifiers = blocksToModifiers(blocks)
	const modifiersStyles: Record<string, React.CSSProperties> = {
		BOOKING: { backgroundColor: '#bfdbfe', borderRadius: '4px' },
		LEASE: { backgroundColor: '#ddd6fe', borderRadius: '4px' },
		MAINTENANCE: { backgroundColor: '#fde68a', borderRadius: '4px' },
		PERSONAL: { backgroundColor: '#e5e7eb', borderRadius: '4px' },
		OTHER: { backgroundColor: '#e5e7eb', borderRadius: '4px' },
	}

	const form = useForm<BlockForm>({
		resolver: zodResolver(blockSchema),
		defaultValues: { unit_id: selectedUnitId },
	})

	const { mutateAsync: createBlock, isPending: isCreating } =
		useCreateDateBlock()
	const { mutateAsync: deleteBlock, isPending: isDeleting } =
		useDeleteDateBlock()

	const invalidateBlocks = () => {
		if (selectedUnitId) {
			void queryClient.invalidateQueries({
				queryKey: [
					QUERY_KEYS.DATE_BLOCKS,
					clientId,
					propertyId,
					selectedUnitId,
				],
			})
		}
	}

	const handleAddBlock = async (values: BlockForm) => {
		try {
			await createBlock({
				clientId,
				propertyId,
				unitId: values.unit_id,
				block_type: values.block_type,
				start_date: values.start_date.toISOString(),
				end_date: values.end_date.toISOString(),
				reason: values.reason,
			})
			toast.success('Date block added')
			setSheetOpen(false)
			form.reset()
			invalidateBlocks()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to add block')
		}
	}

	const handleDeleteBlock = async (blockId: string) => {
		try {
			await deleteBlock({ clientId, propertyId, blockId })
			toast.success('Block removed')
			setSelectedBlock(null)
			invalidateBlocks()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to remove block')
		}
	}

	const openSheet = () => {
		form.reset({ unit_id: selectedUnitId })
		setSheetOpen(true)
	}

	return (
		<div className="mx-6 my-6 flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<TypographyH4>Units Availability</TypographyH4>
					<TypographyMuted>
						View and manage the availability of your units by blocking out
						dates.
					</TypographyMuted>
				</div>
				<PropertyPermissionGuard roles={['MANAGER']}>
					<Button
						size="sm"
						className="bg-rose-600 text-white hover:bg-rose-700"
						onClick={openSheet}
					>
						Block Dates
					</Button>
				</PropertyPermissionGuard>
			</div>

			<div className="grid grid-cols-12 gap-6">
				{/* Calendar */}
				<div className="col-span-12 lg:col-span-8">
					<Card className="shadow-none">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<CardTitle className="text-base">Calendar</CardTitle>
								<Select
									value={selectedUnitId}
									onValueChange={setSelectedUnitId}
								>
									<SelectTrigger className="w-48">
										<SelectValue placeholder="Select unit" />
									</SelectTrigger>
									<SelectContent>
										{units.map((u) => (
											<SelectItem key={u.id} value={u.id}>
												{u.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</CardHeader>
						<CardContent>
							{!selectedUnitId ? (
								<TypographyMuted>
									Select a unit to view its availability.
								</TypographyMuted>
							) : isLoadingBlocks ? (
								<div className="flex items-center justify-center py-10">
									<Spinner />
								</div>
							) : (
								<Calendar
									className="mx-auto [--cell-size:--spacing(9)] sm:[--cell-size:--spacing(14)]"
									month={currentMonth}
									onMonthChange={setCurrentMonth}
									modifiers={modifiers}
									modifiersStyles={modifiersStyles}
									onDayClick={(day: Date) => {
										const block = blocks?.find((b) => {
											const start = localizedDayjs(b.start_date)
											const end = localizedDayjs(b.end_date)
											const d = localizedDayjs(day)
											return (
												(d.isSame(start) || d.isAfter(start)) &&
												(d.isSame(end) || d.isBefore(end))
											)
										})
										setSelectedBlock(block ?? null)
									}}
								/>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Block detail / legend */}
				<div className="col-span-12 space-y-4 lg:col-span-4">
					{selectedBlock ? (
						<Card className="shadow-none">
							<CardHeader>
								<CardTitle className="text-sm">Block Details</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<Row
									label="Type"
									value={
										BLOCK_TYPE_CONFIG[selectedBlock.block_type]?.label ??
										selectedBlock.block_type
									}
								/>
								<Row
									label="Start"
									value={localizedDayjs(selectedBlock.start_date).format(
										'MMM D, YYYY',
									)}
								/>
								<Row
									label="End"
									value={localizedDayjs(selectedBlock.end_date).format(
										'MMM D, YYYY',
									)}
								/>
								{selectedBlock.reason ? (
									<Row label="Reason" value={selectedBlock.reason} />
								) : null}
								{selectedBlock.block_type !== 'BOOKING' &&
								selectedBlock.block_type !== 'LEASE' ? (
									<PropertyPermissionGuard roles={['MANAGER']}>
										<Button
											size="sm"
											variant="outline"
											className="w-full border-rose-500 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
											disabled={isDeleting}
											onClick={() => void handleDeleteBlock(selectedBlock.id)}
										>
											{isDeleting ? <Spinner /> : null}
											Remove Block
										</Button>
									</PropertyPermissionGuard>
								) : null}
							</CardContent>
						</Card>
					) : null}

					<Card className="shadow-none">
						<CardHeader>
							<CardTitle className="text-sm">Legend</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{Object.entries(BLOCK_TYPE_CONFIG).map(([type, cfg]) => (
								<div key={type} className="flex items-center gap-2">
									<span
										className="h-3 w-3 shrink-0 rounded-sm"
										style={{ backgroundColor: cfg.color }}
									/>
									<span className="text-xs">{cfg.label}</span>
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Block dates sheet */}
			<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
				<SheetContent className="p-6">
					<SheetHeader>
						<SheetTitle>Block Dates</SheetTitle>
						<SheetDescription>
							Mark dates as unavailable for a unit.
						</SheetDescription>
					</SheetHeader>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(handleAddBlock)}
							className="mt-6 space-y-4"
						>
							<FormField
								control={form.control}
								name="unit_id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Unit</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl className="w-full">
												<SelectTrigger>
													<SelectValue placeholder="Select unit" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{units.map((u) => (
													<SelectItem key={u.id} value={u.id}>
														{u.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="block_type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Block Type</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl className="w-full">
												<SelectTrigger>
													<SelectValue placeholder="Select type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="MAINTENANCE">Maintenance</SelectItem>
												<SelectItem value="PERSONAL">Personal</SelectItem>
												<SelectItem value="OTHER">Other</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="start_date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Start</FormLabel>
											<FormControl>
												<DatePickerInput
													value={field.value}
													onChange={field.onChange}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="end_date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>End</FormLabel>
											<FormControl>
												<DatePickerInput
													value={field.value}
													onChange={field.onChange}
													startMonth={form.watch('start_date') ?? new Date()}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="reason"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Reason (optional)</FormLabel>
										<FormControl>
											<Textarea {...field} placeholder="e.g. Renovation work" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button
								type="submit"
								disabled={isCreating}
								className="w-full bg-rose-600 text-white hover:bg-rose-700"
							>
								{isCreating ? <Spinner /> : null}
								Add Block
							</Button>
						</form>
					</Form>
				</SheetContent>
			</Sheet>
		</div>
	)
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-muted-foreground text-xs">{label}</span>
			<span className="text-xs font-medium">{value}</span>
		</div>
	)
}
