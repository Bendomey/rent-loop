import { ChevronDownIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { useDisclosure } from '~/hooks/use-disclosure'
import { cn } from '~/lib/utils'

interface Props {
	value: Date | undefined
	onChange: (date: Date | undefined) => void
	placeholder?: string
}

export function DatePickerInput({ value, onChange, placeholder }: Props) {
	const { isOpened, setIsOpened } = useDisclosure()
	return (
		<Popover open={isOpened} onOpenChange={setIsOpened}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					id="date"
					className={cn(
						'w-full justify-between font-normal',
						value ? '' : 'text-muted-foreground',
					)}
				>
					{value ? value.toLocaleDateString() : (placeholder ?? 'Select date')}
					<ChevronDownIcon />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto overflow-hidden p-0" align="start">
				<Calendar
					mode="single"
					selected={value}
					captionLayout="dropdown"
					onSelect={(date) => {
						onChange(date)
						setIsOpened(false)
					}}
				/>
			</PopoverContent>
		</Popover>
	)
}
