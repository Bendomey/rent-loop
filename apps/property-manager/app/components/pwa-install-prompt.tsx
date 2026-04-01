import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'pwa-install-dismissed'

function isIos() {
	if (typeof navigator === 'undefined') return false
	return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
	if (typeof window === 'undefined') return false
	return window.matchMedia('(display-mode: standalone)').matches
}

export function PwaInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null)
	const [showIosHint, setShowIosHint] = useState(false)
	const [dismissed, setDismissed] = useState(false)

	useEffect(() => {
		// Don't show if already installed or previously dismissed
		if (
			isInStandaloneMode() ||
			sessionStorage.getItem(DISMISSED_KEY) === 'true'
		) {
			return
		}

		if (isIos()) {
			setShowIosHint(true)
			return
		}

		const handler = (e: Event) => {
			e.preventDefault()
			setDeferredPrompt(e as BeforeInstallPromptEvent)
		}

		window.addEventListener('beforeinstallprompt', handler)

		const onInstalled = () => setDeferredPrompt(null)
		window.addEventListener('appinstalled', onInstalled)

		return () => {
			window.removeEventListener('beforeinstallprompt', handler)
			window.removeEventListener('appinstalled', onInstalled)
		}
	}, [])

	const handleDismiss = () => {
		sessionStorage.setItem(DISMISSED_KEY, 'true')
		setDeferredPrompt(null)
		setShowIosHint(false)
		setDismissed(true)
	}

	const handleInstall = async () => {
		if (!deferredPrompt) return
		await deferredPrompt.prompt()
		const { outcome } = await deferredPrompt.userChoice
		if (outcome === 'dismissed') {
			sessionStorage.setItem(DISMISSED_KEY, 'true')
		}
		setDeferredPrompt(null)
	}

	if (dismissed) return null

	if (showIosHint) {
		return (
			<div className="bg-card fixed right-4 bottom-4 left-4 z-50 rounded-lg border p-4 shadow-lg sm:right-auto sm:w-80">
				<div className="flex items-start justify-between gap-3">
					<div className="flex flex-col gap-1">
						<p className="text-card-foreground text-sm font-medium">
							Install Rentloop
						</p>
						<p className="text-muted-foreground text-xs">
							Tap the share button{' '}
							<span aria-label="share icon" role="img">
								⎋
							</span>{' '}
							then &ldquo;Add to Home Screen&rdquo;
						</p>
					</div>
					<button
						onClick={handleDismiss}
						aria-label="Dismiss"
						className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 text-lg leading-none"
					>
						×
					</button>
				</div>
			</div>
		)
	}

	if (!deferredPrompt) return null

	return (
		<div className="bg-card fixed right-4 bottom-4 left-4 z-50 rounded-lg border p-4 shadow-lg sm:right-auto sm:w-80">
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<p className="text-card-foreground text-sm font-medium">
						Install Rentloop
					</p>
					<p className="text-muted-foreground text-xs">
						Add to your home screen for quick access
					</p>
				</div>
				<button
					onClick={handleDismiss}
					aria-label="Dismiss"
					className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 text-lg leading-none"
				>
					×
				</button>
			</div>
			<div className="mt-3 flex gap-2">
				<button
					onClick={() => void handleInstall()}
					className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-xs font-medium"
				>
					Install
				</button>
				<button
					onClick={handleDismiss}
					className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-xs"
				>
					Not now
				</button>
			</div>
		</div>
	)
}
