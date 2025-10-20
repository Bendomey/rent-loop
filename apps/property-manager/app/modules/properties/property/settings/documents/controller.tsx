import { Download, Plus, Search } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '~/components/ui/input-group'

export const PropertyDocumentsController = () => {
	return (
		<div className="flex w-full flex-col gap-2">
			<div className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4">
				<div className="flex items-center gap-2 text-sm">
					<InputGroup>
						<InputGroupInput placeholder="Search documents ..." />
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>
				</div>
				<div className="flex items-center justify-end gap-2">
					<Button variant="outline" size="sm">
						<Download className="size-4" />
						Import
					</Button>
					<Link to="/settings/documents/new">
						<Button
							variant="default"
							size="sm"
							className="bg-rose-600 text-white hover:bg-rose-700"
						>
							<Plus className="size-4" />
							Add Document
						</Button>
					</Link>
				</div>
			</div>
		</div>
	)
}
