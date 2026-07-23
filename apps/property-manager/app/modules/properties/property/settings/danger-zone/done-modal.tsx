import { CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'

interface Props {
	propertyName: string
	opened: boolean
	setOpened: (v: boolean) => void
}

export function DeletionDoneModal({ propertyName, opened, setOpened }: Props) {
	const navigate = useNavigate()

	const backToPortfolio = () => {
		setOpened(false)
		void navigate('/properties')
	}

	return (
		<AlertDialog open={opened} onOpenChange={setOpened}>
			<AlertDialogContent className="sm:max-w-md">
				<div className="flex flex-col items-center py-4 text-center">
					<div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
						<CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
					</div>
					<AlertDialogHeader className="mt-5 items-center">
						<AlertDialogTitle>Property deleted</AlertDialogTitle>
						<AlertDialogDescription className="text-center">
							<span className="text-foreground font-medium">
								{propertyName}
							</span>{' '}
							and its records were archived. Nothing was permanently erased —
							restore it anytime from Archived properties.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="mt-6 flex-row justify-center gap-2">
						<AlertDialogCancel disabled>View archived</AlertDialogCancel>
						<AlertDialogAction onClick={backToPortfolio}>
							Back to portfolio
						</AlertDialogAction>
					</AlertDialogFooter>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	)
}
