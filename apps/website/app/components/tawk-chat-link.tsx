import { MessageCircle } from 'lucide-react'

export function TawkChatLink() {
	function handleClick() {
		if (typeof window === 'undefined' || !window.Tawk_API) return
		window.Tawk_API.showWidget?.()
		window.Tawk_API.maximize?.()
	}

	return (
		<div className="flex justify-center py-6">
			<button
				type="button"
				onClick={handleClick}
				className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-rose-600 transition-colors"
			>
				<MessageCircle className="h-4 w-4" />
				Need help? Chat with us
			</button>
		</div>
	)
}
