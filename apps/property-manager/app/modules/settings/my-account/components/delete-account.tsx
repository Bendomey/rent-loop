import { TriangleAlert } from 'lucide-react'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

interface Props {
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	email: string
}

/**
 * UI only — account deletion is not wired to the API yet. The confirm
 * button stays disabled until the typed email matches.
 */
export default function DeleteAccountModal({
	opened,
	setOpened,
	email,
}: Props) {
	const [confirmation, setConfirmation] = useState('')
	const canDelete =
		confirmation.trim().toLowerCase() === email.trim().toLowerCase() &&
		email.length > 0

	const consequences = [
		'You lose access to every property in this workspace',
		'Properties you own must be transferred to another owner first',
		'Your signed documents stay on record for legal reasons',
		'All active sessions are signed out immediately',
	]

	return (
		<Dialog open={opened} onOpenChange={setOpened}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<div className="bg-primary/10 text-primary mb-2 flex size-12 items-center justify-center rounded-xl">
						<TriangleAlert className="size-5" />
					</div>
					<DialogTitle>Delete your account?</DialogTitle>
					<DialogDescription>
						This closes your account and removes you from this workspace. It
						can&rsquo;t be undone.
					</DialogDescription>
				</DialogHeader>

				<div className="border-primary/25 rounded-xl border p-4">
					<div className="mb-2 text-sm font-semibold">What happens</div>
					<ul className="space-y-1.5">
						{consequences.map((item) => (
							<li key={item} className="flex gap-2.5">
								<span className="text-primary text-sm leading-relaxed">•</span>
								<span className="text-muted-foreground text-[13px] leading-relaxed">
									{item}
								</span>
							</li>
						))}
					</ul>
				</div>

				<div className="space-y-2">
					<Label htmlFor="delete-confirmation">
						Type your email to confirm
					</Label>
					<Input
						id="delete-confirmation"
						value={confirmation}
						onChange={(e) => setConfirmation(e.target.value)}
						placeholder={email}
						autoComplete="off"
					/>
					<p className="text-muted-foreground text-xs">
						Type <span className="text-foreground font-semibold">{email}</span>{' '}
						exactly.
					</p>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpened(false)}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						disabled={!canDelete}
						onClick={() => setOpened(false)}
					>
						Delete my account
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
