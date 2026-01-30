import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useFetcher } from 'react-router'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { APP_NAME } from '~/lib/constants'
import { useTenantApplicationContext } from './context'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { AlertCircleIcon, ArrowRight, Home } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
          import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs"


const ValidationSchema = z.object({
  phone: z
    .string({ error: 'Phone number is required' })
    .min(9, 'Please enter a valid phone number'),
})

type FormSchema = z.infer<typeof ValidationSchema>

export function TenantApplicationPreviewInfoModule() {
  const { goNext, formData, updateFormData } = useTenantApplicationContext()

    const rhfMethods = useForm<FormSchema>({
      resolver: zodResolver(ValidationSchema),
      defaultValues: {},
    })

    const { handleSubmit, control, setValue } = rhfMethods

    useEffect(() => {
        if (formData.phone) {
          setValue('phone', formData.phone, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      }, [formData])

    const onSubmit = async (data: FormSchema) => {
      updateFormData({ phone: data.phone })
      // TODO: implement phone lookup logic (Mutate)
      goNext()
    } 

  return (
        <Form {...rhfMethods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mx-auto my-4 space-y-6 md:my-8 md:max-w-2xl flex w-full items-center justify-center px-4"
          >
      <div className="w-full max-w-xl rounded-xl border shadow-sm">

        {/* Content */}
        <div className="px-6 py-8 space-y-8">

    <Tabs defaultValue="overview" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="overview">Unit Details</TabsTrigger>
        <TabsTrigger value="analytics">User Information</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              View your key metrics and recent project activity. Track progress
              across all your active projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            You have 12 active projects and 3 pending tasks.
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="analytics">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              Track performance and user engagement metrics. Monitor trends and
              identify growth opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Page views are up 25% compared to last month.
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="reports">
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              Generate and download your detailed reports. Export data in
              multiple formats for analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            You have 5 reports ready and available to export.
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Manage your account preferences and options. Customize your
              experience to fit your needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Configure notifications, security, and themes.
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>


            <div className="flex flex-col-reverse gap-3 border-t pt-6 md:flex-row md:justify-between">
                    <Link to={`/`}>
                        <Button
                            type="button"
                            size="lg"
                            variant="outline"
                            className="w-full md:w-auto"
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Back to home
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        size="lg"
                        variant="default"
                        className="w-full bg-rose-600 hover:bg-rose-700 md:w-auto"
                    >
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>

        </div>
      </div>
       </form>
          </Form>
  )
}
