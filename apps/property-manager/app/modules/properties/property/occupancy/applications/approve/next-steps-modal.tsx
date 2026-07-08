import {
	CheckCircle2,
	ChevronRight,
	ClipboardListIcon,
	HouseIcon,
	Plus,
	User,
	Wallet,
} from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'

interface NextStepsContentProps {
	lease: Lease
	name: string
	propertyId: string
	onClose: () => void
}

/**
 * Shared "What's next?" body — used both right after approving an
 * application (embedded in ApproveTenantApplicationModal) and when
 * revisiting an already-completed application (via WhatsNextModal below).
 * Takes the full lease so it can tell whether the lease still needs to be
 * started or is already under way, instead of the caller guessing.
 */
export function NextStepsContent({
	lease,
	name,
	propertyId,
	onClose,
}: NextStepsContentProps) {
	const navigate = useNavigate()
	const leaseStarted = lease.status !== 'Lease.Status.Pending'

	const items: Array<{ icon: typeof HouseIcon; label: string; href: string }> =
		[
			{
				icon: HouseIcon,
				label: leaseStarted ? 'Go to the lease' : 'Start the lease',
				href: `/properties/${propertyId}/occupancy/leases/${lease.id}`,
			},
			{
				icon: Wallet,
				label: 'Add a charge to this lease',
				href: `/properties/${propertyId}/occupancy/leases/${lease.id}?tab=expenses`,
			},
			{
				icon: ClipboardListIcon,
				label: 'Create a move-in inspection checklist',
				href: `/properties/${propertyId}/occupancy/leases/${lease.id}`,
			},
			{
				icon: User,
				label: 'Visit tenant profile',
				href: `/properties/${propertyId}/occupancy/tenants/${lease.tenant_id}`,
			},
			{
				icon: Plus,
				label: 'Create another rental application',
				href: `/properties/${propertyId}/occupancy/applications/new`,
			},
		]

	return (
		<>
			<DialogHeader className="items-center text-center">
				<div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
					<CheckCircle2 className="size-6 text-green-600" />
				</div>
				<DialogTitle>What&apos;s next?</DialogTitle>
				<DialogDescription className="text-center">
					{leaseStarted
						? `${name}'s lease is active. Here's what you can do next.`
						: `${name}'s lease has been created. Here's what you can do next.`}
				</DialogDescription>
			</DialogHeader>

			<div className="divide-border flex flex-col divide-y rounded-lg border">
				{items.map((item) => (
					<button
						key={item.label}
						type="button"
						onClick={() => {
							onClose()
							void navigate(item.href)
						}}
						className="hover:bg-muted/50 flex items-center gap-3 px-4 py-3 text-left transition-colors"
					>
						<item.icon className="text-muted-foreground size-4 shrink-0" />
						<span className="flex-1 text-sm font-medium">{item.label}</span>
						<ChevronRight className="text-muted-foreground size-4 shrink-0" />
					</button>
				))}
			</div>

			<div className="flex justify-end pt-2">
				<Button variant="outline" onClick={onClose}>
					Close
				</Button>
			</div>
		</>
	)
}

interface WhatsNextModalProps {
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	name: string
	propertyId: string
	lease: Lease
}

/**
 * Read-only reopening of the "What's next?" checklist for an
 * already-completed application, without re-running the approval pipeline.
 */
export function WhatsNextModal({
	opened,
	setOpened,
	name,
	propertyId,
	lease,
}: WhatsNextModalProps) {
	return (
		<Dialog open={opened} onOpenChange={setOpened}>
			<DialogContent className="sm:max-w-lg">
				<NextStepsContent
					lease={lease}
					name={name}
					propertyId={propertyId}
					onClose={() => setOpened(false)}
				/>
			</DialogContent>
		</Dialog>
	)
}
