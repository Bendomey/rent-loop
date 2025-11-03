import { ArrowLeft, PencilLine, Save } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { TypographyMuted } from '~/components/ui/typography'

export function MenuBar({ document }: { document: RentloopDocument }) {
	return (
		<div className="flex flex-col justify-between gap-2 border-b py-3 md:flex-row md:items-center md:px-3">
			<div className="flex items-center space-x-2">
				<Link
					to={
						document?.property_id
							? `/properties/${document.property_id}/settings/documents`
							: '/settings/documents'
					}
				>
					<Button size="sm" variant="ghost">
						<ArrowLeft />
					</Button>
				</Link>
				<h1 className="font-medium">{document.title}</h1>
				<Button size="sm" variant="ghost">
					<PencilLine />
				</Button>
			</div>
			<div>
				<TypographyMuted>Changes Made</TypographyMuted>
			</div>
			<div className="flex items-center space-x-2">
				<Button size="sm" variant="ghost" className="text-xs">
					Discard
				</Button>
				<Button size="sm" className="bg-rose-600 text-xs hover:bg-rose-800">
					<Save className="size-3" />
					Save Document
				</Button>
			</div>
		</div>
	)
}
