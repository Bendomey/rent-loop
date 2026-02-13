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
import { cn } from '~/lib/utils'

interface Props {
	propertiesCount: number
	paymentAccountsCount: number
}
export function ClientChecklist({
	propertiesCount,
	paymentAccountsCount,
}: Props) {
	const isProfileComplete = true // for now we are not asking users to complete their profile, but we can easily add this back in the future by passing a prop from the loader.
	const isPropertiesComplete = propertiesCount > 0
	const isPaymentAccountsComplete = paymentAccountsCount > 0

	const steps = [
		isProfileComplete,
		isPropertiesComplete,
		isPaymentAccountsComplete,
	]

	if (steps.every(Boolean)) {
		return null
	}

	return (
		<Dialog>
			<form>
				<DialogTrigger asChild>
					<Alert className="mx-5 mt-4 w-full cursor-pointer border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
						<AlertTriangleIcon />
						<AlertTitle>Complete your checklist</AlertTitle>
						<AlertDescription>
							{steps.filter(Boolean).length}/{steps.length} steps complete
						</AlertDescription>
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
						<DialogClose asChild>
							<Link to="/settings/general">
								<Alert
									className={cn('mb-3 w-full cursor-pointer', {
										'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-50':
											isProfileComplete,
										'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50':
											!isProfileComplete,
									})}
								>
									{isProfileComplete ? <CircleCheck /> : <AlertTriangleIcon />}
									<AlertTitle>Complete Profile</AlertTitle>
									<AlertDescription className="text-xs">
										Your profile tells us a bit about you and your business so
										we can better tailor the experience to your needs.
									</AlertDescription>
								</Alert>
							</Link>
						</DialogClose>
						<DialogClose asChild>
							<Link to="/properties">
								<Alert
									className={cn('mb-3 w-full cursor-pointer', {
										'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-50':
											isPropertiesComplete,
										'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50':
											!isPropertiesComplete,
									})}
								>
									{isPropertiesComplete ? (
										<CircleCheck />
									) : (
										<AlertTriangleIcon />
									)}
									<AlertTitle>Add a property</AlertTitle>
									<AlertDescription className="text-xs">
										Add your first property to start managing your rentals and
										tenants.
									</AlertDescription>
								</Alert>
							</Link>
						</DialogClose>
						<DialogClose asChild>
							<Link to="/settings/payment-accounts">
								<Alert
									className={cn('mb-3 w-full cursor-pointer', {
										'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-50':
											isPaymentAccountsComplete,
										'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50':
											!isPaymentAccountsComplete,
									})}
								>
									{isPaymentAccountsComplete ? (
										<CircleCheck />
									) : (
										<AlertTriangleIcon />
									)}
									<AlertTitle>Add your payment accounts</AlertTitle>
									<AlertDescription className="text-xs">
										Connect your account details to start accepting payments
										online.
									</AlertDescription>
								</Alert>
							</Link>
						</DialogClose>
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
