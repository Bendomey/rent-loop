import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(localizedFormat)
dayjs.extend(relativeTime)

export const localizedDayjs = dayjs

export const convertFromMinutes = (minutes: number) => {
	if (minutes === 0) {
		return {
			hours: 0,
			minutes: 0,
		}
	}

	return {
		hours: Math.trunc(minutes / 60),
		minutes: minutes % 60,
	}
}

export const convertToMinutes = (hours: number, minutes: number) =>
	hours * 60 + minutes
