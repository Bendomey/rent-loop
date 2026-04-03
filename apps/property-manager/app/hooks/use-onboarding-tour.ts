import { useTour } from '~/hooks/use-tour'
import { DASHBOARD_TOUR_STEPS, TOUR_KEYS } from '~/lib/tours'

export function useOnboardingTour() {
	return useTour(TOUR_KEYS.DASHBOARD, DASHBOARD_TOUR_STEPS)
}
