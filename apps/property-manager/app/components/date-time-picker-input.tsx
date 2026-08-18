import dayjs from 'dayjs'
import { ChevronDownIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Calendar } from './ui/calendar'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { useDisclosure } from '~/hooks/use-disclosure'
import { cn } from '~/lib/utils'

interface Props {
	value: Date | undefined
	onChange: (date: Date | undefined) => void
	placeholder?: string
	disabled?: boolean
	minDate?: Date
}

export function DateTimePickerInput({
	value,
	onChange,
	placeholder,
	disabled,
	minDate,
}: Props) {
	const { isOpened, setIsOpened } = useDisclosure()

	// A calendar day's own date object sits at midnight, which is always
	// "before" minDate once any time has passed today — clamp to minDate itself
	// rather than let a picked day + carried-over time land in the past.
	const clamp = (date: Date) =>
		minDate && date < minDate ? new Date(minDate) : date

	const handleDateChange = (date: Date | undefined) => {
		if (!date) {
			onChange(undefined)
			setIsOpened(false)
			return
		}
		const base = value ?? new Date()
		const updated = new Date(date)
		updated.setHours(base.getHours(), base.getMinutes(), 0, 0)
		onChange(clamp(updated))
		setIsOpened(false)
	}

	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const [hours, minutes] = e.target.value.split(':').map(Number)
		const base = value ?? new Date()
		const updated = new Date(base)
		if (hours) {
			updated.setHours(hours, minutes, 0, 0)
		}
		onChange(clamp(updated))
	}

	const timeValue = value
		? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
		: ''

	const minTime =
		minDate && value && dayjs(value).isSame(minDate, 'day')
			? `${String(minDate.getHours()).padStart(2, '0')}:${String(minDate.getMinutes()).padStart(2, '0')}`
			: undefined

	return (
		<div className="flex gap-2">
			<Popover open={isOpened} onOpenChange={setIsOpened}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						disabled={disabled}
						className={cn(
							'flex-1 justify-between font-normal',
							!value && 'text-muted-foreground',
						)}
					>
						{value
							? dayjs(value).format('MMM D, YYYY')
							: (placeholder ?? 'Select date')}
						<ChevronDownIcon />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto overflow-hidden p-0" align="start">
					<Calendar
						mode="single"
						selected={value}
						captionLayout="dropdown"
						startMonth={minDate ?? new Date()}
						disabled={
							minDate
								? (date) => dayjs(date).isBefore(minDate, 'day')
								: undefined
						}
						onSelect={handleDateChange}
					/>
				</PopoverContent>
			</Popover>
			<Input
				type="time"
				value={timeValue}
				min={minTime}
				onChange={handleTimeChange}
				disabled={disabled || !value}
				className="w-32"
			/>
		</div>
	)
}
