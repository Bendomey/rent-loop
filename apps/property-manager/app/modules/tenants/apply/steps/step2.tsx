import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTenantApplicationContext } from '../context'
import { Button } from '~/components/ui/button'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '~/components/ui/input-otp'
import {
	TypographyH2,
	TypographyMuted,
	TypographySmall,
} from '~/components/ui/typography'

const tenantApplicationData: TenantApplication = {
	id: 'ta_001',
	on_boarding_method: 'SELF',

	first_name: 'Kwame',
	other_names: 'Nana',
	last_name: 'Mensah',
	email: 'kwame.mensah@example.com',
	phone: '+233501234567',
	gender: 'MALE',
	date_of_birth: '1994-06-15',
	nationality: 'Ghanaian',
	marital_status: 'SINGLE',

	profile_photo_url: null,

	id_type: 'NATIONAL_ID',
	id_number: 'GHA-123456789',
	id_front_url: null,
	id_back_url: null,

	status: 'TenantApplication.Status.InProgress',

	current_address: 'East Legon, Accra',
	emergency_contact_name: 'Ama Mensah',
	emergency_contact_phone: '+233241112223',
	relationship_to_emergency_contact: 'Sister',

	employment_type: 'WORKER',
	occupation: 'Software Developer',
	employer: 'Tech Solutions Ltd',
	occupation_address: 'Airport, Accra',
	proof_of_income_url: null,

	created_by: null,
	created_by_id: 'user_001',

	completed_at: null,
	completed_by_id: null,
	completed_by: null,

	cancelled_at: null,
	cancelled_by_id: null,
	cancelled_by: null,

	desired_unit_id: 'unit_123',
	desired_unit: {
		id: 'unit_123',
		name: '2 Bedroom Apartment',
		// add other required Unit fields here
	} as PropertyUnit,

	previous_landlord_name: 'Mr. Boateng',
	previous_landlord_phone: '+233209998887',
	previous_tenancy_period: 'Jan 2021 - Dec 2023',

	created_at: new Date('2024-01-10T10:00:00Z'),
	updated_at: new Date('2024-01-15T14:30:00Z'),
}

const isSubmitting = false
const error = null

export function Step2() {
	const [otp, setOtp] = useState('')
	const [canResend, setCanResend] = useState(true)
	const [resendCountdown, setResendCountdown] = useState(0)

	const { goBack, goNext, goToPage, formData, updateFormData, allowEdit } =
		useTenantApplicationContext()

	// const rhfMethods = useForm<FormSchema>({
	// 	resolver: zodResolver(ValidationSchema),
	// })

	useEffect(() => {
		let t: NodeJS.Timeout | null = null
		if (resendCountdown > 0) {
			t = setTimeout(() => setResendCountdown((s) => s - 1), 1000)
		} else if (resendCountdown === 0) {
			setCanResend(true)
		}

		return () => {
			if (t) clearTimeout(t)
		}
	}, [resendCountdown])

	const resend = () => {
		if (!canResend) return
		setCanResend(false)
		setResendCountdown(30)
	}

	useEffect(() => {
		if (otp.length === 4) {
			void onSubmit()
		}
	}, [otp])

	const verify = () => {
		//    ToDO: verify OTP logic (Mutate to backend)
	}

	const phoneLookUp = () => {
		//    ToDO: Phone lookup logic to get user data
		if (otp !== '1234') {
			return null
		} else {
			return tenantApplicationData
		}
	}

	const onSubmit = async () => {
		verify()
		const lookUpData = phoneLookUp()
		if (!lookUpData) {
			allowEdit(true)
			goNext()
		} else {
			updateFormData({
				// step3 data
				first_name: lookUpData.first_name,
				other_names: lookUpData.other_names,
				last_name: lookUpData.last_name,
				email: lookUpData.email,
				phone: lookUpData.phone,
				current_address: lookUpData.current_address,
				profile_photo_url: lookUpData.profile_photo_url,
				date_of_birth: lookUpData.date_of_birth?.toString(),
				gender: lookUpData.gender,
				marital_status: lookUpData.marital_status,

				// step4 data
				nationality: lookUpData.nationality,
				id_type: lookUpData.id_type,
				id_number: lookUpData.id_number,
				id_front_url: lookUpData.id_front_url,
				id_back_url: lookUpData.id_back_url,

				// step5 data
				emergency_contact_name: lookUpData.emergency_contact_name,
				relationship_to_emergency_contact:
					lookUpData.relationship_to_emergency_contact,
				emergency_contact_phone: lookUpData.emergency_contact_phone,
				employment_type: lookUpData.employment_type,
				occupation:
					lookUpData.employment_type === 'STUDENT'
						? lookUpData.employment_type
						: lookUpData.occupation,
				employer: lookUpData.employer,
				occupation_address: lookUpData.occupation_address,
				proof_of_income_url: lookUpData.proof_of_income_url,
			})
			goToPage(6)
		}
	}

	return (
		<div className="mx-auto flex w-full items-center justify-center md:max-w-2xl">
			<div className="w-full max-w-lg rounded-2xl border bg-white p-6 shadow-sm md:p-8">
				{/* Header */}
				<div className="space-y-2 text-center">
					<TypographyH2 className="text-lg font-semibold">
						Verify your phone number
					</TypographyH2>
					<TypographyMuted className="leading-relaxed">
						Enter the 4-digit code sent to{' '}
						<span className="font-medium text-zinc-900">
							{formData?.phone || 'your phone'}
						</span>
					</TypographyMuted>
				</div>

				{/* OTP Input */}
				<div className="mt-8 flex justify-center">
					<InputOTP
						maxLength={4}
						pattern={REGEXP_ONLY_DIGITS}
						value={otp}
						onChange={(v: any) => setOtp(v)}
					>
						<InputOTPGroup className="*:data-[slot=input-otp-slot]:h-14 *:data-[slot=input-otp-slot]:w-18 *:data-[slot=input-otp-slot]:text-xl">
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
							<InputOTPSlot index={3} />
						</InputOTPGroup>
					</InputOTP>
				</div>
				{error && (
					<TypographySmall className="text-destructive mt-4 text-center">
						{error}
					</TypographySmall>
				)}

				{/* Resend */}
				<div className="mt-6 flex justify-center">
					<Button
						type="button"
						disabled={!canResend}
						variant="ghost"
						size="sm"
						className="text-rose-600 hover:bg-transparent hover:underline disabled:opacity-50"
						onClick={resend}
					>
						{canResend ? 'Resend code' : `Resend in ${resendCountdown}s`}
					</Button>
				</div>

				<div className="mt-10 flex flex-col-reverse gap-3 border-t pt-6 md:flex-row md:justify-between">
					<Button
						onClick={goBack}
						type="button"
						size="lg"
						variant="outline"
						className="w-full md:w-auto"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back
					</Button>

					<Button
						size="lg"
						variant="default"
						onClick={onSubmit}
						disabled={otp.length < 4 || isSubmitting}
						className="w-full bg-rose-600 hover:bg-rose-700 md:w-auto"
					>
						{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Verify code
						<ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}
