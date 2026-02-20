import { Check, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DocumentCard } from './document-card'
import { useGetDocuments } from '~/api/documents'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Skeleton } from '~/components/ui/skeleton'
import { TypographyMuted } from '~/components/ui/typography'
import { useDebounce } from '~/hooks/use-debounce'
import { cn } from '~/lib/utils'
import type { IDocumentTemplate } from '~/modules/settings/documents/controller'

type DocFilter = 'all' | 'global' | 'property'

const filterChips: { value: DocFilter; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'global', label: 'Global Docs' },
	{ value: 'property', label: 'Property Docs' },
]

interface DocumentListProps {
	selectedDocument?: RentloopDocument | null
	onSelectDocument?: (document: RentloopDocument) => void
	property_id: string
	documentTemplates: IDocumentTemplate[]
}

export function DocumentList({
	selectedDocument,
	onSelectDocument,
	property_id,
	documentTemplates,
}: DocumentListProps) {
	const [search, setSearch] = useState('')
	const [filter, setFilter] = useState<DocFilter>('all')

	const emptyDocumentTemplate = documentTemplates.find(
		(doc) => doc.id === 'empty',
	)
	const EMPTY_DOCUMENT_SENTINEL: RentloopDocument = {
		id: '__empty__',
		type: 'DOCUMENT',
		title: 'Empty Document',
		content: JSON.stringify(emptyDocumentTemplate?.document),
		size: emptyDocumentTemplate?.charCount ?? 0,
		tags: [],
		property_id: '',
		created_by_id: '',
		updated_by_id: '',
		created_at: new Date(),
		updated_at: new Date(),
	}

	const filters = useMemo(() => {
		if (filter === 'global') return { only_global_documents: true }
		if (filter === 'property') return { property_id }

		return {
			include_global_documents: true,
			property_id,
		}
	}, [filter, property_id])

	const debouncedSearch = useDebounce({
		delay: 250,
		value: search,
	})
	const { data: documents, isPending } = useGetDocuments({
		filters: {
			...filters,
			type: 'TEMPLATE',
		},
		pagination: { page: 1, per: 50 },
		sorter: { sort: 'desc', sort_by: 'created_at' },
		search: {
			fields: ['title'],
			query: debouncedSearch.length > 0 ? debouncedSearch : undefined,
		},
	})

	const hasDocuments = documents && documents.rows.length > 0
	const isEmptySelected = selectedDocument?.id === EMPTY_DOCUMENT_SENTINEL.id

	return (
		<div className="space-y-3">
			<div className="relative">
				<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
				<Input
					placeholder="Search documents..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-9"
				/>
			</div>

			<div className="flex gap-2">
				{filterChips.map((chip) => (
					<button
						key={chip.value}
						type="button"
						onClick={() => setFilter(chip.value)}
						className={cn(
							'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
							filter === chip.value
								? 'border-rose-500 bg-rose-50 text-rose-700'
								: 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50',
						)}
					>
						{chip.label}
					</button>
				))}
			</div>

			{isPending ? (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Card key={i} className="shadow-none">
							<CardContent className="flex flex-col items-center gap-3 p-4">
								<Skeleton className="h-12 w-12 rounded-md" />
								<div className="flex flex-col items-center gap-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-3 w-16" />
									<Skeleton className="h-5 w-20 rounded-full" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<Card
						onClick={() => onSelectDocument?.(EMPTY_DOCUMENT_SENTINEL)}
						className={cn(
							'relative cursor-pointer shadow-none transition-colors hover:bg-zinc-50',
							isEmptySelected && 'border-blue-500 bg-blue-50 hover:bg-blue-50',
						)}
					>
						{isEmptySelected && (
							<div className="absolute top-2 right-2">
								<Check className="size-5 text-blue-600" />
							</div>
						)}
						<CardContent className="flex flex-col items-center gap-3 p-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-dashed border-zinc-300">
								<Plus className="size-5 text-zinc-400" />
							</div>
							<div className="flex flex-col items-center text-center">
								<span className="text-sm font-medium">Empty Document</span>
								<span className="text-xs text-zinc-500">
									Start from scratch
								</span>
							</div>
						</CardContent>
					</Card>

					{hasDocuments &&
						documents.rows.map((doc) => (
							<DocumentCard
								key={doc.id}
								document={doc}
								isSelected={selectedDocument?.id === doc.id}
								onClick={() => onSelectDocument?.(doc)}
							/>
						))}
				</div>
			)}

			{!isPending && !hasDocuments && (
				<TypographyMuted className="text-center text-xs">
					No templates available — create them in property settings
				</TypographyMuted>
			)}
		</div>
	)
}
