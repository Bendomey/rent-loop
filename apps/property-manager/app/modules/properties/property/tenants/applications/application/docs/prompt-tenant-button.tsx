import { Send } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '~/components/ui/button'

const COOLDOWN_SECONDS = 60

export function PromptTenantButton() {
	const [countdown, setCountdown] = useState(COOLDOWN_SECONDS)
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const isOnCooldown = countdown < COOLDOWN_SECONDS && countdown > 0

	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
		}
	}, [])

	const handlePrompt = useCallback(() => {
		// TODO: call API to send signing prompt to tenant
		setCountdown(COOLDOWN_SECONDS - 1)
		intervalRef.current = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					if (intervalRef.current) clearInterval(intervalRef.current)
					return COOLDOWN_SECONDS
				}
				return prev - 1
			})
		}, 1000)
	}, [])

	return (
		<div className="flex items-center gap-3">
			<Button
				size="sm"
				variant="outline"
				disabled={isOnCooldown}
				onClick={handlePrompt}
			>
				<Send className="size-4" />
				{isOnCooldown
					? `Resend in ${countdown}s`
					: 'Prompt Tenant to Sign'}
			</Button>
			{isOnCooldown && (
				<p className="text-xs text-zinc-400">
					A signing request has been sent to the tenant.
				</p>
			)}
		</div>
	)
}
