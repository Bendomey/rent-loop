import { QrCode, ShieldCheck } from 'lucide-react'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { PLACEHOLDER_TWO_FACTOR_KEY } from '../placeholder-data'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '~/components/ui/input-otp'
import { Label } from '~/components/ui/label'

interface Props {
	opened: boolean
	setOpened: Dispatch<SetStateAction<boolean>>
	onEnabled: () => void
}

/**
 * UI only — two-factor enrolment is not wired to the API yet. The QR code
 * and setup key below are placeholders.
 */
export default function EnableTwoFactorModal({
	opened,
	setOpened,
	onEnabled,
}: Props) {
	const [code, setCode] = useState('')

	return (
		<Dialog open={opened} onOpenChange={setOpened}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<div className="bg-muted mb-2 flex size-12 items-center justify-center rounded-xl">
						<ShieldCheck className="size-5" />
					</div>
					<DialogTitle>Set up two-factor authentication</DialogTitle>
					<DialogDescription>
						Scan the code with an authenticator app, then enter the 6-digit code
						it shows.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-5 sm:flex-row">
					<div className="bg-muted text-muted-foreground flex size-37 shrink-0 items-center justify-center self-center rounded-xl border sm:self-start">
						<QrCode className="size-16" />
					</div>

					<div className="flex flex-1 flex-col gap-4">
						<div>
							<div className="text-muted-foreground font-mono text-[10.5px] tracking-wider uppercase">
								Or enter this key manually
							</div>
							<div className="mt-1.5 font-mono text-sm font-bold tracking-widest">
								{PLACEHOLDER_TWO_FACTOR_KEY}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="two-factor-code">6-digit code</Label>
							<InputOTP
								id="two-factor-code"
								maxLength={6}
								value={code}
								onChange={setCode}
							>
								<InputOTPGroup>
									{[0, 1, 2, 3, 4, 5].map((i) => (
										<InputOTPSlot key={i} index={i} />
									))}
								</InputOTPGroup>
							</InputOTP>
						</div>
					</div>
				</div>

				<div className="rounded-xl bg-emerald-500/10 px-3.5 py-3 text-[13px] leading-relaxed text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">
					Save your recovery codes after turning this on — they&rsquo;re the
					only way in if you lose your phone.
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpened(false)}>
						Cancel
					</Button>
					<Button
						disabled={code.length !== 6}
						onClick={() => {
							onEnabled()
							setOpened(false)
						}}
					>
						Turn on 2FA
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
