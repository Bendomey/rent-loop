import { type DriveStep, driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useCallback } from 'react'

export function useTour(key: string, steps: DriveStep[]) {
	const hasCompletedTour = useCallback(() => {
		return localStorage.getItem(key) === 'true'
	}, [key])

	const startTour = useCallback(() => {
		const driverObj = driver({
			showProgress: true,
			animate: true,
			overlayOpacity: 0.4,
			stagePadding: 6,
			stageRadius: 8,
			popoverClass: 'rent-loop-tour-popover',
			nextBtnText: 'Next →',
			prevBtnText: '← Back',
			doneBtnText: 'Done',
			onDestroyStarted: () => {
				localStorage.setItem(key, 'true')
				driverObj.destroy()
			},
			steps,
		})

		driverObj.drive()
	}, [key, steps])

	return { startTour, hasCompletedTour }
}
