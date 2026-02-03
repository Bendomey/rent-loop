import { AlertTriangleIcon, CircleCheck } from 'lucide-react'
import { Link } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/components/ui/dialog'

export function ClientChecklist() {
	return (
		<Dialog>
			<form>
				<DialogTrigger asChild>
					<Alert className="w-full cursor-pointer border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
						<AlertTriangleIcon />
						<AlertTitle>Complete your checklist</AlertTitle>
						<AlertDescription>2/3 steps complete</AlertDescription>
					</Alert>
				</DialogTrigger>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>Complete your profile</DialogTitle>
						<DialogDescription>
							You're almost there! Please complete the following steps to get
							all set up.
						</DialogDescription>
					</DialogHeader>

					<div className="mt-5">
						<Link to="/settings/general">
							<Alert className="mb-3 w-full cursor-pointer border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-50">
								<CircleCheck />
								<AlertTitle>Complete Profile</AlertTitle>
								<AlertDescription className="text-xs">
									Your profile tells us a bit about you and your business so we
									can better tailor the experience to your needs.
								</AlertDescription>
							</Alert>
						</Link>
						<Link to="/properties">
							<Alert className="mb-3 w-full cursor-pointer border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-50">
								<CircleCheck />
								<AlertTitle>Add a property</AlertTitle>
								<AlertDescription className="text-xs">
									Add your first property to start managing your rentals and
									tenants.
								</AlertDescription>
							</Alert>
						</Link>
						<Link to="/settings/payment-accounts">
							<Alert className="w-full cursor-pointer border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
								<AlertTriangleIcon />
								<AlertTitle>Add your payment accounts</AlertTitle>
								<AlertDescription className="text-xs">
									Connect your account details to start accepting payments
									online.
								</AlertDescription>
							</Alert>
						</Link>
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">Close</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</form>
		</Dialog>
	)
}
