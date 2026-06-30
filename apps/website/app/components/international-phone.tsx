import type { CountryCode } from 'libphonenumber-js'
import PhoneInput from 'react-phone-number-input'
import { cn } from '~/lib/utils'
import 'react-phone-number-input/style.css'

type InternationalPhoneInputProps = {
	value?: string
	onChange: (value: string) => void
	error?: boolean
	placeholder?: string
	className?: string
	defaultCountry?: CountryCode
	disabled?: boolean
}

export function InternationalPhoneInput({
	value,
	onChange,
	error,
	placeholder = 'Enter phone number',
	className,
	defaultCountry = 'GH',
	disabled,
}: InternationalPhoneInputProps) {
	return (
		<div
			className={cn(
				'bg-background flex items-center rounded-md border px-3',
				'focus-within:ring-ring focus-within:ring-2',
				error && 'border-destructive focus-within:ring-destructive/20',
				disabled && 'cursor-not-allowed opacity-60',
				className,
			)}
		>
			<PhoneInput
				international
				defaultCountry={defaultCountry}
				countryCallingCodeEditable={false}
				value={value}
				onChange={(value) => onChange(value ?? '')}
				placeholder={placeholder}
				disabled={disabled}
				className="flex h-10 w-full items-center gap-2"
				numberInputProps={{
					className:
						'flex-1 border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:!ring-0 focus-visible:!outline-none focus-visible:!ring-offset-0',
					disabled,
				}}
				countrySelectProps={{
					className: 'border-0 bg-transparent text-sm shadow-none focus:ring-0',
					disabled,
				}}
			/>
		</div>
	)
}
