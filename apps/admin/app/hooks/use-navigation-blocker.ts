import { useEffect } from 'react'
import { useBlocker } from 'react-router'

/**
 * useNavigationBlocker — blocks both SPA navigations and hard refreshes
 */
export function useNavigationBlocker(
	when: boolean,
	message = 'You have unsaved changes. Are you sure you want to leave?',
) {
	// Block internal route changes
	const blocker = useBlocker(when)

	useEffect(() => {
		if (!when) return

		// Block hard refresh / tab close / external navigation
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault()
			event.returnValue = message
			return message
		}

		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	}, [when, message])

	return blocker
}
