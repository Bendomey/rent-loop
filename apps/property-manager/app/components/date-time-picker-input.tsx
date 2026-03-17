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

	const handleDateChange = (date: Date | undefined) => {
		if (!date) {
			onChange(undefined)
			setIsOpened(false)
			return
		}
		const base = value ?? new Date()
		const updated = new Date(date)
		updated.setHours(base.getHours(), base.getMinutes(), 0, 0)
		onChange(updated)
		setIsOpened(false)
	}

	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const [hours, minutes] = e.target.value.split(':').map(Number)
		const base = value ?? new Date()
		const updated = new Date(base)
		if (hours) {
			updated.setHours(hours, minutes, 0, 0)
		}
		onChange(updated)
	}

	const timeValue = value
		? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
		: ''

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
						disabled={minDate ? (date) => date < minDate : undefined}
						onSelect={handleDateChange}
					/>
				</PopoverContent>
			</Popover>
			<Input
				type="time"
				value={timeValue}
				onChange={handleTimeChange}
				disabled={disabled || !value}
				className="w-32"
			/>
		</div>
	)
}
