import type { Blocker } from 'react-router'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'

interface Props {
	blocker: Blocker
}

export function BlockNavigationDialog({ blocker }: Props) {
	const isOpened = blocker.state === 'blocked'
	return (
		<Dialog open={isOpened} onOpenChange={() => blocker.reset?.()}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>You have unsaved changes.</DialogTitle>
					<DialogDescription>Are you sure you want to leave?</DialogDescription>
				</DialogHeader>
				<DialogFooter className="mt-5">
					<DialogClose asChild>
						<Button variant="outline" onClick={() => blocker.reset?.()}>
							Cancel
						</Button>
					</DialogClose>
					<Button type="button" onClick={() => blocker.proceed?.()}>
						Leave
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
