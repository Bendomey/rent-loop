import { useEffect, useState } from 'react'

export function PwaUpdatePrompt() {
	const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

	useEffect(() => {
		if (!('serviceWorker' in navigator)) return

		void navigator.serviceWorker.ready.then((registration) => {
			if (registration.waiting) {
				setWaitingWorker(registration.waiting)
			}
			registration.addEventListener('updatefound', () => {
				const newWorker = registration.installing
				newWorker?.addEventListener('statechange', () => {
					if (
						newWorker.state === 'installed' &&
						navigator.serviceWorker.controller
					) {
						setWaitingWorker(newWorker)
					}
				})
			})
		})
	}, [])

	if (!waitingWorker) return null

	return (
		<div className="bg-card fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-lg border p-4 shadow-lg">
			<span className="text-card-foreground text-sm">
				A new version is available.
			</span>
			<button
				onClick={() => {
					const onControllerChange = () => {
						navigator.serviceWorker.removeEventListener(
							'controllerchange',
							onControllerChange,
						)
						window.location.reload()
					}
					navigator.serviceWorker.addEventListener(
						'controllerchange',
						onControllerChange,
					)
					waitingWorker.postMessage({ type: 'SKIP_WAITING' })
				}}
				className="text-primary text-sm font-medium underline"
			>
				Reload
			</button>
		</div>
	)
}
