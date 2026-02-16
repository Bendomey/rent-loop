import { FileText, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DocumentCard } from './document-card'
import { useGetDocuments } from '~/api/documents'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Skeleton } from '~/components/ui/skeleton'
import { TypographyMuted } from '~/components/ui/typography'
import { useDebounce } from '~/hooks/use-debounce'
import { cn } from '~/lib/utils'

type DocFilter = 'all' | 'global' | 'property'

const filterChips: { value: DocFilter; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'global', label: 'Global Docs' },
	{ value: 'property', label: 'Property Docs' },
]

interface DocumentListProps {
	selectedDocumentId?: string | null
	onSelectDocument?: (documentId: string) => void
	property_id: string
}

export function DocumentList({
	selectedDocumentId,
	onSelectDocument,
	property_id,
}: DocumentListProps) {
	const [search, setSearch] = useState('')
	const [filter, setFilter] = useState<DocFilter>('all')

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
		filters,
		pagination: { page: 1, per: 50 },
		sorter: { sort: 'desc', sort_by: 'created_at' },
		search: {
			fields: ['title'],
			query: debouncedSearch.length > 0 ? debouncedSearch : undefined,
		},
	})

	const hasDocuments = documents && documents.rows.length > 0

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
			) : !hasDocuments ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
					<FileText className="size-8 text-zinc-400" />
					<TypographyMuted className="mt-2">
						No documents available
					</TypographyMuted>
					<TypographyMuted className="text-xs">
						Create document templates in property settings
					</TypographyMuted>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{documents.rows.map((doc) => (
						<DocumentCard
							key={doc.id}
							document={doc}
							isSelected={selectedDocumentId === doc.id}
							onClick={() => onSelectDocument?.(doc.id)}
						/>
					))}
				</div>
			)}
		</div>
	)
}
