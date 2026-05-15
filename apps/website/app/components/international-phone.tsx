import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import type { CountryCode } from 'libphonenumber-js'
import { cn } from '~/lib/utils'

type InternationalPhoneInputProps = {
	value?: string
	onChange: (value: string) => void
	error?: boolean
	placeholder?: string
	className?: string
	defaultCountry?: CountryCode
}

export function InternationalPhoneInput({
	value,
	onChange,
	error,
	placeholder = 'Enter phone number',
	className,
	defaultCountry = 'GH',
}: InternationalPhoneInputProps) {
	return (
		<div
			className={cn(
				'flex items-center rounded-md border bg-white px-3',
				'focus-within:ring-2 focus-within:ring-rose-500',
				error && 'border-red-500 focus-within:ring-red-500/20',
				className,
			)}
		>
			<PhoneInput
				international
				defaultCountry={defaultCountry}
				countryCallingCodeEditable={false}
				value={value}
				onChange={(val) => onChange(val ?? '')}
				placeholder={placeholder}
				className="flex h-10 w-full items-center gap-2"
				inputClassName={cn(
					'flex-1 border-0 bg-transparent px-2 py-2 text-sm shadow-none',
					'focus-visible:outline-none focus-visible:ring-0',
				)}
				countrySelectProps={{
					className: 'border-0 bg-transparent text-sm shadow-none focus:ring-0',
				}}
			/>
		</div>
	)
}
