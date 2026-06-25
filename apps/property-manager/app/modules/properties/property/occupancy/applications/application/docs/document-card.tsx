import { Building, Check, Eye, FileText, Globe } from 'lucide-react'
import { ExternalLink } from '~/components/external-link'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { localizedDayjs } from '~/lib/date'
import { cn } from '~/lib/utils'

interface DocumentCardProps {
	document: RentloopDocument
	isSelected?: boolean
	onClick?: () => void
}

export function DocumentCard({
	document,
	isSelected = false,
	onClick,
}: DocumentCardProps) {
	const isGlobal = !document.property_id
	const viewLink = isGlobal
		? `/settings/documents/${document.id}`
		: `/properties/${document.property_id}/settings/documents/${document.id}`

	return (
		<Card
			onClick={onClick}
			className={cn(
				'relative cursor-pointer shadow-none transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700',
				isSelected && 'border-blue-500 bg-blue-50 hover:bg-blue-50 dark:border-blue-400 dark:bg-blue-950 dark:text-white dark:hover:bg-blue-900',
			)}
		>
			{isSelected && (
				<div className="absolute top-2 right-2">
					<Check className="size-5 text-blue-600" />
				</div>
			)}
			<CardContent className="flex flex-col items-center gap-3 p-4">
				<Badge
					variant="default"
					className="flex h-12 w-12 flex-col bg-blue-100 p-1 dark:bg-blue-950 dark:text-blue-300"
				>
					<FileText className="h-full w-full text-blue-600" />
					<span className="text-[8px] font-bold text-black dark:text-white">DOCX</span>
				</Badge>
				<div className="flex flex-col items-center text-center">
					<span className="line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
						{document.title}
					</span>
					<span className="text-xs text-zinc-500 dark:text-zinc-400">
						{localizedDayjs(document.updated_at).format('MMM D, YYYY')}
					</span>
					<Badge
						variant="outline"
						className={cn(
							'mt-2 gap-1',
							isGlobal
								? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
								: 'bg-blue-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200',
						)}
					>
						{isGlobal ? (
							<>
								<Globe className="size-3" />
								Global
							</>
						) : (
							<>
								<Building className="size-3" />
								Property
							</>
						)}
					</Badge>
					<ExternalLink
						to={viewLink}
						onClick={(e) => e.stopPropagation()}
						className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-300"
					>
						<Eye className="size-3" />
						View
					</ExternalLink>
				</div>
			</CardContent>
		</Card>
	)
}
