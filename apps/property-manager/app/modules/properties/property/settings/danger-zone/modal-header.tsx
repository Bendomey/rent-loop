import { Trash2, X } from 'lucide-react'
import {
	AlertDialogDescription,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'

interface Props {
	propertyName: string
	onClose: () => void
}

export function DeleteModalHeader({ propertyName, onClose }: Props) {
	return (
		<div className="flex items-start justify-between gap-4">
			<div className="flex items-start gap-3">
				<div className="bg-destructive/10 flex size-11 shrink-0 items-center justify-center rounded-xl">
					<Trash2 className="text-destructive size-5" />
				</div>
				<div>
					<AlertDialogTitle className="font-serif text-xl font-normal">
						Delete property
					</AlertDialogTitle>
					<AlertDialogDescription>{propertyName}</AlertDialogDescription>
				</div>
			</div>
			<button
				type="button"
				onClick={onClose}
				className="bg-muted hover:bg-accent flex size-8 shrink-0 items-center justify-center rounded-lg"
			>
				<X className="size-4" />
				<span className="sr-only">Close</span>
			</button>
		</div>
	)
}
