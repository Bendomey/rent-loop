import dayjs from 'dayjs'
import {
	AlertCircle,
	CheckCircle2,
	Download,
	FileSpreadsheet,
	Info,
	Pencil,
	Plus,
	Trash2,
	Upload,
} from 'lucide-react'
import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { BulkOnboardProvider, toDraftApiEntry, useBulkOnboard } from './context'
import type { DraftApplicationEntry } from './context'
import { BulkOnboardWizard } from './wizard'
import { useBulkCreateTenantApplications } from '~/api/tenant-applications'
import { BlockNavigationDialog } from '~/components/block-navigation-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
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
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

const BATCH_SIZE = 50

// CSV/Excel column headers and their mapping to DraftApplicationEntry fields
const COLUMN_MAP: Record<string, keyof DraftApplicationEntry> = {
	phone: 'phone',
	first_name: 'first_name',
	last_name: 'last_name',
	email: 'email',
	gender: 'gender',
	date_of_birth: 'date_of_birth',
	nationality: 'nationality',
	marital_status: 'marital_status',
	id_type: 'id_type',
	id_number: 'id_number',
	current_address: 'current_address',
	occupation: 'occupation',
	employer: 'employer',
}

const TEMPLATE_FIELDS: {
	column: string
	required: boolean
	description: string
	options?: string[]
	example: string
}[] = [
	{
		column: 'phone',
		required: true,
		description: 'Phone number in international format.',
		example: '+233201234567',
	},
	{
		column: 'first_name',
		required: false,
		description: "Tenant's first name.",
		example: 'Kwame',
	},
	{
		column: 'last_name',
		required: false,
		description: "Tenant's last name.",
		example: 'Mensah',
	},
	{
		column: 'email',
		required: false,
		description: 'Email address. Used for notification delivery.',
		example: 'kwame@example.com',
	},
	{
		column: 'gender',
		required: false,
		description: 'Must be one of the allowed values.',
		options: ['MALE', 'FEMALE'],
		example: 'MALE',
	},
	{
		column: 'date_of_birth',
		required: false,
		description: 'Date in YYYY-MM-DD format.',
		example: '1990-06-15',
	},
	{
		column: 'nationality',
		required: false,
		description: "Tenant's nationality.",
		example: 'Ghanaian',
	},
	{
		column: 'marital_status',
		required: false,
		description: 'Must be one of the allowed values.',
		options: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'],
		example: 'SINGLE',
	},
	{
		column: 'id_type',
		required: false,
		description:
			'Type of government-issued ID. Must be one of the allowed values.',
		options: ['GHANA_CARD', 'NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE'],
		example: 'GHANA_CARD',
	},
	{
		column: 'id_number',
		required: false,
		description: 'The ID document number.',
		example: 'GHA-123456789-0',
	},
	{
		column: 'current_address',
		required: false,
		description: "Tenant's current residential address.",
		example: '12 Liberation Rd, Accra',
	},
	{
		column: 'occupation',
		required: false,
		description: "Tenant's job title or occupation.",
		example: 'Software Engineer',
	},
	{
		column: 'employer',
		required: false,
		description: "Name of the tenant's employer or company.",
		example: 'Acme Corp',
	},
]

function doDownloadTemplate() {
	const a = document.createElement('a')
	a.href = '/templates/tenant-migration-template.xlsx'
	a.download = 'tenant-migration-template.xlsx'
	a.click()
}

function parseFileToEntries(
	file: File,
): Promise<(Omit<DraftApplicationEntry, 'id'> & { phone: string })[]> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = (e) => {
			try {
				const data = e.target?.result
				const wb = XLSX.read(data, { type: 'array', cellDates: true })
				const sheetName = wb.SheetNames[0]!
				const ws = wb.Sheets[sheetName]!
				const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
					defval: '',
				})

				const entries = rows
					.map((row) => {
						const entry: Record<string, string> = {}
						for (const [colKey, fieldKey] of Object.entries(COLUMN_MAP)) {
							const val = row[colKey]
							if (val !== undefined && val !== '') {
								if (fieldKey === 'date_of_birth' && val instanceof Date) {
									entry[fieldKey] = dayjs(val).format('YYYY-MM-DD')
								} else {
									entry[fieldKey] = String(val)
								}
							}
						}
						return entry
					})
					.filter(
						(e): e is Record<string, string> & { phone: string } =>
							!!e['phone'],
					)

				resolve(
					entries.map((e) => ({
						phone: e['phone'],
						first_name: e['first_name'],
						last_name: e['last_name'],
						email: e['email'],
						gender: e['gender'],
						date_of_birth: e['date_of_birth'],
						nationality: e['nationality'],
						marital_status: e['marital_status'],
						id_type: e['id_type'],
						id_number: e['id_number'],
						current_address: e['current_address'],
						occupation: e['occupation'],
						employer: e['employer'],
					})),
				)
			} catch (err) {
				reject(err)
			}
		}
		reader.onerror = () => reject(new Error('Failed to read file'))
		reader.readAsArrayBuffer(file)
	})
}

function TemplateGuideModal({
	open,
	onClose,
}: {
	open: boolean
	onClose: () => void
}) {
	const handleDownload = () => {
		doDownloadTemplate()
		onClose()
	}

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="flex max-h-[85vh] max-w-2xl flex-col overflow-hidden p-0">
				{/* Fixed header */}
				<DialogHeader className="shrink-0 px-6 pt-6 pb-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900">
							<FileSpreadsheet className="h-5 w-5 text-rose-600 dark:text-rose-400" />
						</div>
						<div>
							<DialogTitle className="text-base font-semibold">
								Tenant Migration Template
							</DialogTitle>
							<p className="text-muted-foreground mt-0.5 text-xs">
								Download the Excel template and fill in your tenants. Only{' '}
								<span className="font-medium text-rose-600">phone</span> is
								required — everything else is optional.
							</p>
						</div>
					</div>
				</DialogHeader>

				{/* Scrollable body */}
				<div className="scrollbar-visible min-h-0 flex-1 px-6">
					{/* How it works */}
					<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
						<p className="font-medium">How it works</p>
						<ol className="mt-1.5 list-inside list-decimal space-y-1 text-xs">
							<li>Download the template and fill in your tenants' details.</li>
							<li>
								Upload the completed file using the{' '}
								<span className="font-medium">Import File</span> button.
							</li>
							<li>
								Each tenant receives an SMS (and email if provided) with a link
								to complete any missing information.
							</li>
							<li>
								Manage the resulting applications from the Applications tab as
								normal.
							</li>
						</ol>
					</div>

					{/* Field reference table */}
					<div className="mt-4 pb-2">
						<p className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
							Column Reference
						</p>
						<div className="rounded-lg border text-sm">
							<table className="w-full table-fixed">
								<colgroup>
									<col className="w-[28%]" />
									<col className="w-[16%]" />
									<col className="w-[36%]" />
									<col className="w-[20%]" />
								</colgroup>
								<thead>
									<tr className="border-b bg-zinc-50 dark:bg-zinc-900">
										<th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
											Column
										</th>
										<th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
											Required
										</th>
										<th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
											Details
										</th>
										<th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">
											Example
										</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{TEMPLATE_FIELDS.map((f) => (
										<tr
											key={f.column}
											className="align-top transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
										>
											<td className="px-3 py-2.5">
												<code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs break-all text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
													{f.column}
												</code>
											</td>
											<td className="px-3 py-2.5">
												{f.required ? (
													<span className="text-xs font-medium text-rose-600">
														Required
													</span>
												) : (
													<span className="text-xs text-zinc-400">
														Optional
													</span>
												)}
											</td>
											<td className="px-3 py-2.5">
												<p className="text-xs text-zinc-600 dark:text-zinc-400">
													{f.description}
												</p>
												{f.options && (
													<div className="mt-1 flex flex-wrap gap-1">
														{f.options.map((o) => (
															<span
																key={o}
																className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
															>
																{o}
															</span>
														))}
													</div>
												)}
											</td>
											<td className="px-3 py-2.5">
												<span className="text-xs break-all text-zinc-500 dark:text-zinc-400">
													{f.example}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{/* Fixed action buttons */}
				<div className="flex shrink-0 gap-2 border-t px-6 py-4">
					<Button
						className="flex-1 bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
						onClick={handleDownload}
					>
						<Download className="mr-2 h-4 w-4" /> Download Template
					</Button>
					<Button variant="outline" className="flex-1" onClick={onClose}>
						Close
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function BulkOnboardTable() {
	const {
		entries,
		editingEntryId,
		startEdit,
		removeEntry,
		addManyEntries,
		isSubmitting,
		setIsSubmitting,
	} = useBulkOnboard()
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const navigate = useNavigate()
	const { mutateAsync: bulkCreate } = useBulkCreateTenantApplications()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [templateModalOpen, setTemplateModalOpen] = useState(false)

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

	const handleFileUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
	): Promise<void> => {
		const file = e.target.files?.[0]
		if (!file) return
		e.target.value = ''
		try {
			const parsed = await parseFileToEntries(file)
			if (parsed.length === 0) {
				toast.error(
					'No valid rows found. Make sure the phone column is filled.',
				)
				return
			}
			const newEntries: DraftApplicationEntry[] = parsed.map((p) => ({
				...p,
				id: crypto.randomUUID(),
			}))
			addManyEntries(newEntries)
			toast.success(`${newEntries.length} tenant(s) imported from file.`)
		} catch {
			toast.error('Failed to parse file. Please use the provided template.')
		}
	}

	const handleSubmitAll = async (): Promise<void> => {
		if (entries.length === 0 || isSubmitting) return
		setIsSubmitting(true)
		try {
			const allEntries = entries.map(toDraftApiEntry)
			const batches: (typeof allEntries)[] = []
			for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
				batches.push(allEntries.slice(i, i + BATCH_SIZE))
			}
			await Promise.all(
				batches.map((batch) =>
					bulkCreate({
						client_id: clientId,
						property_id: propertyId,
						entries: batch,
					}),
				),
			)

			toast.success(
				`${entries.length} application${entries.length > 1 ? 's' : ''} created. Tenants will receive an SMS to complete their profile.`,
			)
			void navigate(`/properties/${propertyId}/tenants/applications`)
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
			<TemplateGuideModal
				open={templateModalOpen}
				onClose={() => setTemplateModalOpen(false)}
			/>

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
						onClick={() => setTemplateModalOpen(true)}
					>
						<Download className="mr-1 h-4 w-4" /> Download Template
					</Button>
					<Button
						variant="outline"
						disabled={isSubmitting}
						onClick={() => fileInputRef.current?.click()}
					>
						<Upload className="mr-1 h-4 w-4" /> Import File
					</Button>
					<input
						ref={fileInputRef}
						type="file"
						accept=".csv,.xlsx,.xls"
						className="hidden"
						onChange={(e) => void handleFileUpload(e)}
					/>
					<Button
						variant="outline"
						disabled={isSubmitting}
						onClick={() => startEdit('new')}
					>
						<Plus className="mr-1 h-4 w-4" /> Add Tenant
					</Button>
					<Button
						disabled={entries.length === 0 || isSubmitting}
						className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
						onClick={() => void handleSubmitAll()}
					>
						{isSubmitting ? 'Submitting…' : `Submit All (${entries.length})`}
					</Button>
				</div>
			</div>

			{/* Info banner */}
			<div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
				<Info className="mt-0.5 h-4 w-4 shrink-0" />
				<p>
					Use the <span className="font-medium">Import File</span> button to
					upload a CSV or Excel file with your tenants. Download the{' '}
					<span className="font-medium">template</span> for the correct format.
					Only phone number is required — tenants will receive an SMS to
					complete their profile. For new lease applications with full details,
					use the{' '}
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
						No tenants added yet. Import a file or add manually.
					</TypographyMuted>
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => setTemplateModalOpen(true)}
						>
							<Download className="mr-1 h-4 w-4" /> Download Template
						</Button>
						<Button
							onClick={() => startEdit('new')}
							className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
						>
							<Plus className="mr-1 h-4 w-4" /> Add Manually
						</Button>
					</div>
				</div>
			) : (
				<div className="rounded-lg border shadow-none">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Phone</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Unit</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="w-[80px]" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{entries.map((entry) => (
								<TableRow key={entry.id}>
									<TableCell className="font-medium">{entry.phone}</TableCell>
									<TableCell>
										{entry.first_name || entry.last_name
											? `${entry.first_name ?? ''} ${entry.last_name ?? ''}`.trim()
											: '—'}
									</TableCell>
									<TableCell>{entry.unit_name ?? '—'}</TableCell>
									<TableCell>
										{entry.first_name && entry.last_name ? (
											<Badge className="bg-green-500 text-white">
												<CheckCircle2 className="mr-1 h-3 w-3" /> Has name
											</Badge>
										) : (
											<Badge
												variant="outline"
												className="border-amber-500 text-amber-600"
											>
												<AlertCircle className="mr-1 h-3 w-3" /> Phone only
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
