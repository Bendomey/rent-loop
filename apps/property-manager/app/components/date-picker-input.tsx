import { ChevronDownIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { useDisclosure } from '~/hooks/use-disclosure'
import { cn } from '~/lib/utils'

interface Props {
	value: Date | undefined
	onChange: (date: Date | undefined) => void
	/**
	 * Which individual days can't be picked — the react-day-picker matcher, not
	 * a switch for the whole field. Use `readOnly` for that.
	 */
	disabled?: (date: Date) => boolean
	/** Shows the date but refuses to open the calendar. */
	readOnly?: boolean
	placeholder?: string
	startMonth?: Date
	endMonth?: Date
}

export function DatePickerInput({
	value,
	onChange,
	disabled,
	readOnly,
	placeholder,
	startMonth,
	endMonth,
}: Props) {
	const { isOpened, setIsOpened } = useDisclosure()
	return (
		<Popover open={isOpened} onOpenChange={setIsOpened}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					id="date"
					disabled={readOnly}
					className={cn(
						'w-full justify-between font-normal',
						value ? '' : 'text-muted-foreground',
					)}
				>
					{value ? value.toLocaleDateString() : (placeholder ?? 'Select date')}
					{readOnly ? null : <ChevronDownIcon />}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto overflow-hidden p-0" align="start">
				<Calendar
					mode="single"
					selected={value}
					captionLayout="dropdown"
					startMonth={startMonth}
					endMonth={endMonth}
					onSelect={(date) => {
						onChange(date)
						setIsOpened(false)
					}}
					disabled={disabled}
				/>
			</PopoverContent>
		</Popover>
	)
}
