import { ClipboardListIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { ChecklistModal } from './checklist-modal'
import { CreateChecklistDialog } from './create-checklist-dialog'
import { useGetLeaseChecklists } from '~/api/lease-checklists'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import {
	getChecklistStatusClass,
	getChecklistStatusLabel,
	getChecklistTypeLabel,
} from '~/lib/lease-checklist.utils'

interface Props {
	leaseId: string
	canEdit: boolean
	propertyId: string
}

const CHECKLIST_TYPES: LeaseChecklistType[] = [
	'CHECK_IN',
	'CHECK_OUT',
	'ROUTINE',
]

export function ChecklistSection({ leaseId, canEdit, propertyId }: Props) {
	const { data, isLoading } = useGetLeaseChecklists(propertyId, leaseId, {
		populate: ['Items', 'Acknowledgments'],
	})
	const [createType, setCreateType] = useState<LeaseChecklistType | null>(null)
	const [viewChecklistId, setViewChecklistId] = useState<string | null>(null)

	const checklists = data?.rows ?? []
	const viewChecklist = checklists.find((c) => c.id === viewChecklistId) ?? null

	// Group by type for easy lookup
	const byType: Record<string, LeaseChecklist[]> = {}
	for (const c of checklists) {
		if (!byType[c.type]) byType[c.type] = []
		byType[c.type]!.push(c)
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
					Inspection Reports
				</p>
			</div>
			<Separator />

			{isLoading ? (
				<div className="space-y-2">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			) : checklists.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-6 text-center">
					<ClipboardListIcon className="text-muted-foreground size-8" />
					<TypographyMuted className="text-sm">
						No inspection reports yet.
					</TypographyMuted>
					{canEdit && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="sm" variant="outline">
									<PlusIcon className="mr-1 size-3.5" />
									Create Report
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-44">
								<DropdownMenuGroup>
									<DropdownMenuItem onClick={() => setCreateType('CHECK_IN')}>
										<ClipboardListIcon className="text-muted-foreground size-4 shrink-0" />
										Move In
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setCreateType('CHECK_OUT')}>
										<ClipboardListIcon className="text-muted-foreground size-4 shrink-0" />
										Move Out
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setCreateType('ROUTINE')}>
										<ClipboardListIcon className="text-muted-foreground size-4 shrink-0" />
										Routine Inspection
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			) : (
				<div className="space-y-2">
					{CHECKLIST_TYPES.flatMap((type) =>
						(byType[type] ?? []).map((checklist) => (
							<ChecklistRow
								key={checklist.id}
								checklist={checklist}
								onView={() => setViewChecklistId(checklist.id)}
							/>
						)),
					)}
					{canEdit && (
						<div className="pt-1">
							<DropdownCreate
								existingTypes={checklists.map((c) => c.type)}
								onSelect={setCreateType}
							/>
						</div>
					)}
				</div>
			)}

			{/* Create dialog */}
			{createType && (
				<CreateChecklistDialog
					leaseId={leaseId}
					propertyId={propertyId}
					type={createType}
					opened={!!createType}
					setOpened={(open) => !open && setCreateType(null)}
				/>
			)}

			{/* Full view modal */}
			{viewChecklist && (
				<ChecklistModal
					leaseId={leaseId}
					propertyId={propertyId}
					checklist={viewChecklist}
					canEdit={canEdit}
					opened={!!viewChecklist}
					setOpened={(open) => !open && setViewChecklistId(null)}
				/>
			)}
		</div>
	)
}

function ChecklistRow({
	checklist,
	onView,
}: {
	checklist: LeaseChecklist
	onView: () => void
}) {
	const pendingCount = checklist.items.filter(
		(i) => i.status === 'PENDING',
	).length
	const totalItems = checklist.items.length

	return (
		<button
			type="button"
			onClick={onView}
			className="hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition-colors"
		>
			<div className="flex min-w-0 items-center gap-2">
				<ClipboardListIcon className="text-muted-foreground size-4 shrink-0" />
				<div className="min-w-0">
					<p className="text-sm font-medium">
						{getChecklistTypeLabel(checklist.type)}
					</p>
					<TypographyMuted className="text-xs">
						{checklist.status === 'DISPUTED'
							? 'Tenant disputed — needs your attention'
							: totalItems === 0
								? 'No items'
								: pendingCount > 0
									? `${pendingCount} of ${totalItems} items need attention`
									: `${totalItems} items`}
						{checklist.status === 'SUBMITTED' && checklist.submitted_at
							? ` · Submitted ${localizedDayjs(checklist.submitted_at).format('MMM D, YYYY')}`
							: ''}
					</TypographyMuted>
				</div>
			</div>
			<Badge
				className={`shrink-0 text-xs ${getChecklistStatusClass(checklist.status)}`}
			>
				{getChecklistStatusLabel(checklist.status)}
			</Badge>
		</button>
	)
}

function DropdownCreate({
	existingTypes,
	onSelect,
}: {
	existingTypes: LeaseChecklistType[]
	onSelect: (type: LeaseChecklistType) => void
}) {
	const ALL_TYPES: { type: LeaseChecklistType; label: string }[] = [
		{ type: 'CHECK_IN', label: 'Move-In Report' },
		{ type: 'ROUTINE', label: 'Routine Inspection' },
		{ type: 'CHECK_OUT', label: 'Move-Out Report' },
	]
	const available = ALL_TYPES.filter((t) => !existingTypes.includes(t.type))

	if (available.length === 0) return null

	return (
		<div className="flex flex-wrap gap-2">
			{available.map((t) => (
				<Button
					key={t.type}
					size="sm"
					variant="ghost"
					className="text-muted-foreground h-7 text-xs"
					onClick={() => onSelect(t.type)}
				>
					<PlusIcon className="mr-1 size-3" />
					{t.label}
				</Button>
			))}
		</div>
	)
}
