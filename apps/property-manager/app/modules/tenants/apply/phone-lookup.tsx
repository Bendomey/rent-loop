import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useFetcher } from 'react-router'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { TypographyH2, TypographyH3, TypographyMuted, TypographySmall } from '~/components/ui/typography'
import { APP_NAME } from '~/lib/constants'
import { useTenantApplicationContext } from './context'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { ArrowRight, Home } from 'lucide-react'

const ValidationSchema = z.object({
  phone: z
    .string({ error: 'Phone number is required' })
    .min(9, 'Please enter a valid phone number'),
})

type FormSchema = z.infer<typeof ValidationSchema>

export function TenantApplicationPhoneLookUpModule() {
  const { goNext, formData, updateFormData } = useTenantApplicationContext()
  
    const rhfMethods = useForm<FormSchema>({
      resolver: zodResolver(ValidationSchema),
      defaultValues: {
        },
    })
  
    	const { handleSubmit, control, setValue } = rhfMethods

  
    const onSubmit = async (data: FormSchema) => {
      goNext()
    }

  return (
        <Form {...rhfMethods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mx-auto my-4 space-y-6 md:my-8 md:max-w-2xl"
          >

       
    <div className="flex w-full items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white shadow-sm">

        {/* Content */}
        <div className="px-6 py-8 space-y-6">
          <div className="space-y-2">
            <TypographyH2 className="text-lg font-semibold">
              Enter your phone number
            </TypographyH2>

            <TypographyMuted>
              We&apos;ll use this to check if you&apos;ve applied before.
              If we find an existing application, your details will be
              filled automatically.
            </TypographyMuted>
          </div>

            <div className="space-y-2">
             <FormField
								name="phone"
								control={control}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											Phone <span className="text-red-500">*</span>
										</FormLabel>
										<FormControl>
											<Input {...field} type="text" />
										</FormControl>
										<FormDescription>
											We'll send notifications to this number  Use the phone number you&apos;ll be reachable on.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t pt-6 md:flex-row md:justify-between">
					<Link to={`/`}>
						<Button
							type="button"
							size="lg"
							variant="outline"
							className="w-full md:w-auto"
						>
							<Home className="mr-2 h-4 w-4" />
							Go Home
						</Button>
					</Link>
					<Button
						size="lg"
						variant="default"
						className="w-full bg-rose-600 hover:bg-rose-700 md:w-auto"
					>
						Continue <ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>

            {/* 
              After submit:
              - If phone exists → show OTP verification here
              - If new → proceed to unit selection
            */}
        </div>
      </div>
    </div>
       </form>
          </Form>
  )
}
