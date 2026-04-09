import { AlertCircle, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { BulkOnboardProvider, useBulkOnboard } from './context'
import { BulkOnboardWizard } from './wizard'
import {
	type BulkOnboardLeaseEntryInput,
	useBulkOnboardLeases,
} from '~/api/leases'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

const MAX_ENTRIES = 20

function BulkOnboardTable() {
	const {
		entries,
		editingEntryId,
		startEdit,
		removeEntry,
		isSubmitting,
		setIsSubmitting,
	} = useBulkOnboard()
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const navigate = useNavigate()
	const { mutateAsync: bulkOnboard } = useBulkOnboardLeases()

	const propertyId = safeString(clientUserProperty?.property_id)
	const clientId = safeString(clientUser?.client_id)

	if (editingEntryId !== null) {
		const editingEntry = entries.find((e) => e.id === editingEntryId)
		return <BulkOnboardWizard editingEntry={editingEntry} />
	}

	const allComplete = entries.length > 0 && entries.every((e) => e.isComplete)

	const handleSubmitAll = async () => {
		if (!allComplete || isSubmitting) return
		setIsSubmitting(true)
		try {
			await bulkOnboard({
				clientId,
				propertyId,
				entries: entries.map((e) => e.formData as BulkOnboardLeaseEntryInput),
			})
			toast.success(
				`${entries.length} lease${entries.length > 1 ? 's' : ''} onboarded successfully.`,
			)
			void navigate(`/properties/${propertyId}/tenants/leases`)
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: 'Failed to submit. Please try again.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="mx-6 my-6 flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<TypographyH2 className="text-xl font-bold">
						Onboard Existing Tenants
					</TypographyH2>
					<TypographyMuted>
						{clientUserProperty?.property?.name} · {entries.length} /{' '}
						{MAX_ENTRIES} added
					</TypographyMuted>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						disabled={entries.length >= MAX_ENTRIES || isSubmitting}
						onClick={() => startEdit('new')}
					>
						<Plus className="mr-1 h-4 w-4" /> Add Tenant
					</Button>
					<Button
						disabled={!allComplete || isSubmitting}
						className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
						onClick={() => void handleSubmitAll()}
					>
						{isSubmitting ? 'Submitting…' : `Submit All (${entries.length})`}
					</Button>
				</div>
			</div>

			{/* Progress bar */}
			<div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800">
				<div
					className="h-1 rounded-full bg-rose-600 transition-all"
					style={{ width: `${(entries.length / MAX_ENTRIES) * 100}%` }}
				/>
			</div>

			{entries.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
					<TypographyMuted className="mb-4">
						No tenants added yet.
					</TypographyMuted>
					<Button
						onClick={() => startEdit('new')}
						className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
					>
						<Plus className="mr-1 h-4 w-4" /> Add First Tenant
					</Button>
				</div>
			) : (
				<div className="rounded-lg border shadow-none">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Tenant</TableHead>
								<TableHead>Unit</TableHead>
								<TableHead>Rent</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="w-[80px]" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{entries.map((entry) => (
								<TableRow key={entry.id}>
									<TableCell className="font-medium">
										{entry.tenant_name}
									</TableCell>
									<TableCell>{entry.unit_name}</TableCell>
									<TableCell>
										{formatAmount(entry.rent_fee)} {entry.rent_fee_currency}
									</TableCell>
									<TableCell>
										{entry.isComplete ? (
											<Badge className="bg-green-500 text-white">
												<CheckCircle2 className="mr-1 h-3 w-3" /> Complete
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="border-amber-500 text-amber-600"
											>
												<AlertCircle className="mr-1 h-3 w-3" />{' '}
												{entry.missingFields[0] ?? 'Incomplete'}
											</Badge>
										)}
									</TableCell>
									<TableCell>
										<div className="flex gap-1">
											<Button
												size="icon"
												variant="ghost"
												onClick={() => startEdit(entry.id)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() => removeEntry(entry.id)}
											>
												<Trash2 className="text-destructive h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			{entries.length >= MAX_ENTRIES && (
				<p className="text-muted-foreground rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900">
					Maximum of {MAX_ENTRIES} tenants per submission reached. Submit this
					batch first, then start a new one.
				</p>
			)}
		</div>
	)
}

export function BulkOnboardModule() {
	return (
		<BulkOnboardProvider>
			<BulkOnboardTable />
		</BulkOnboardProvider>
	)
}
