import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useFetcher } from 'react-router'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { TypographyH2, TypographyH3, TypographyMuted, TypographySmall } from '~/components/ui/typography'
import { APP_NAME } from '~/lib/constants'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "~/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { useTenantApplicationContext } from './context'

const ValidationSchema = z.object({
  phone: z
    .string({ error: 'Phone number is required' })
    .min(9, 'Please enter a valid phone number'),
})

type FormSchema = z.infer<typeof ValidationSchema>

export function TenantApplicationOTPValidationModule() {
const [otp, setOtp] = useState('')
const [otpError, setOtpError] = useState<string | null>(null)
const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
const [canResend, setCanResend] = useState(true)

const { goBack, goNext, formData, updateFormData } =
        useTenantApplicationContext()

    const rhfMethods = useForm<FormSchema>({
        resolver: zodResolver(ValidationSchema),
    })
	const { handleSubmit, control, setValue } = rhfMethods


  return (
  <div className="rounded-xl border bg-zinc-50">
    <div className="space-y-1 text-center">
      <TypographyH3 className="text-base font-semibold">
        Verify your phone number
      </TypographyH3>
      <TypographyMuted>
        We sent a 6-digit verification code to your phone.
      </TypographyMuted>
    </div>

    {/* OTP Input */}
    <div className="flex justify-center gap-3">
       <InputOTP maxLength={4} pattern={REGEXP_ONLY_DIGITS}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>
    </div>

    {/* Error */}
    {otpError && (
      <TypographySmall className="text-center text-destructive">
        {otpError}
      </TypographySmall>
    )}

    {/* Actions */}
    <div className="flex items-center justify-between pt-2">
      <button
        type="button"
        disabled={!canResend}
        className="text-sm text-rose-600 hover:underline disabled:opacity-50"
        onClick={() => {
          setCanResend(false)
          // trigger resend OTP
        }}
      >
        Resend code
      </button>

      <Button
        disabled={otp.length !== 6 || isVerifyingOtp}
        className="bg-rose-600 hover:bg-rose-700"
      >
        {isVerifyingOtp ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Verify'
        )}
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
                            Go Back
                        </Button>
                        <Button
                            size="lg"
                            variant="default"
                            className="w-full bg-rose-600 hover:bg-rose-700 md:w-auto"
                        >
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
  </div>
  )
}
