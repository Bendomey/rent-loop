import {
	AlertCircle,
	CheckCircle2,
	Info,
	Pencil,
	Plus,
	Trash2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { BulkOnboardProvider, useBulkOnboard } from './context'
import { BulkOnboardWizard } from './wizard'
import {
	type BulkOnboardLeaseEntryInput,
	useBulkOnboardLeases,
} from '~/api/leases'
import { BlockNavigationDialog } from '~/components/block-navigation-dialog'
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
import { useNavigationBlocker } from '~/hooks/use-navigation-blocker'
import { formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

const BATCH_SIZE = 10

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

	const blocker = useNavigationBlocker(
		(entries.length > 0 || editingEntryId !== null) && !isSubmitting,
	)

	if (editingEntryId !== null) {
		const editingEntry = entries.find((e) => e.id === editingEntryId)
		return (
			<>
				<BulkOnboardWizard editingEntry={editingEntry} />
				<BlockNavigationDialog blocker={blocker} />
			</>
		)
	}

	const allComplete = entries.length > 0 && entries.every((e) => e.isComplete)

	const handleSubmitAll = async () => {
		if (!allComplete || isSubmitting) return
		setIsSubmitting(true)
		try {
			const allEntries = entries.map(
				(e) => e.formData as BulkOnboardLeaseEntryInput,
			)
			const batches = []
			for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
				batches.push(allEntries.slice(i, i + BATCH_SIZE))
			}
			await Promise.all(
				batches.map((batch) =>
					bulkOnboard({ clientId, propertyId, entries: batch }),
				),
			)

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
						{clientUserProperty?.property?.name} · {entries.length} added
					</TypographyMuted>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						disabled={isSubmitting}
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

			{/* Disclaimer */}
			<div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
				<Info className="mt-0.5 h-4 w-4 shrink-0" />
				<p>
					This is for tenants who are{' '}
					<span className="font-medium">already living in your property</span>.
					For new tenants, use the{' '}
					<Link
						to={`/properties/${propertyId}/tenants/applications`}
						className="font-medium underline underline-offset-2"
					>
						application process
					</Link>{' '}
					instead.
				</p>
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

			<BlockNavigationDialog blocker={blocker} />
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
