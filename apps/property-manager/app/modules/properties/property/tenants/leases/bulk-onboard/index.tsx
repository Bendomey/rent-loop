import {
	AlertCircle,
	CheckCircle2,
	Download,
	Info,
	Pencil,
	Plus,
	Trash2,
	Upload,
} from 'lucide-react'
import { useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import {
	BulkOnboardProvider,
	toDraftApiEntry,
	useBulkOnboard,
} from './context'
import type { DraftApplicationEntry } from './context'
import { BulkOnboardWizard } from './wizard'
import { useBulkCreateTenantApplications } from '~/api/tenant-applications'
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

function downloadTemplate() {
	const headers = [
		'phone',
		'first_name',
		'last_name',
		'email',
		'gender',
		'date_of_birth',
		'nationality',
		'marital_status',
		'id_type',
		'id_number',
		'current_address',
		'occupation',
		'employer',
	]

	const wb = XLSX.utils.book_new()
	const ws = XLSX.utils.aoa_to_sheet([headers])

	// Column widths
	ws['!cols'] = headers.map(() => ({ wch: 20 }))

	// Data validation dropdowns
	const genderRef = 'E2:E1000'
	const maritalRef = 'H2:H1000'
	const idTypeRef = 'J2:J1000'

	if (!ws['!dataValidations']) ws['!dataValidations'] = []
	ws['!dataValidations'].push(
		{
			sqref: genderRef,
			type: 'list',
			formula1: '"MALE,FEMALE"',
		},
		{
			sqref: maritalRef,
			type: 'list',
			formula1: '"SINGLE,MARRIED,DIVORCED,WIDOWED"',
		},
		{
			sqref: idTypeRef,
			type: 'list',
			formula1: '"GHANA_CARD,NATIONAL_ID,PASSPORT,DRIVER_LICENSE"',
		},
	)

	XLSX.utils.book_append_sheet(wb, ws, 'Tenants')
	XLSX.writeFile(wb, 'tenant-migration-template.xlsx')
}

function parseFileToEntries(
	file: File,
): Promise<(Omit<DraftApplicationEntry, 'id'> & { phone: string })[]> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = (e) => {
			try {
				const data = e.target?.result
				const wb = XLSX.read(data, { type: 'binary', cellDates: true })
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
									entry[fieldKey] = val.toISOString().slice(0, 10)
								} else {
									entry[fieldKey] = String(val)
								}
							}
						}
						return entry
					})
					.filter(
						(e): e is Record<string, string> & { phone: string } => !!e['phone'],
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
		reader.readAsBinaryString(file)
	})
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
		// Reset input so the same file can be re-uploaded
		e.target.value = ''
		try {
			const parsed = await parseFileToEntries(file)
			if (parsed.length === 0) {
				toast.error('No valid rows found. Make sure the phone column is filled.')
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
					bulkCreate({ client_id: clientId, property_id: propertyId, entries: batch }),
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
						onClick={downloadTemplate}
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
					Use the{' '}
					<span className="font-medium">Import File</span> button to upload a
					CSV or Excel file with your tenants. Download the{' '}
					<span className="font-medium">template</span> for the correct format.
					Only phone number is required — tenants will receive an SMS to
					complete their profile. For new tenant applications with full details,
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
						<Button variant="outline" onClick={downloadTemplate}>
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
