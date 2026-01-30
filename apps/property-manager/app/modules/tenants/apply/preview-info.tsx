import { ArrowRight, Home } from 'lucide-react'
import { Link, useRouteLoaderData } from 'react-router'
import { UnitPreview } from './components/unit-preview'
import { UserPreview } from './components/user-preview'
import { useTenantApplicationContext } from './context'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import type { loader } from '~/routes/tenants.apply'

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

export function TenantApplicationPreviewInfoModule() {
	const parentData = useRouteLoaderData<typeof loader>('routes/tenants.apply')
	const { unit } = parentData || {}

	const { formData, onSubmit } = useTenantApplicationContext()

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				await onSubmit(formData)
			}}
			className="mx-auto my-4 w-full space-y-6 md:my-4 md:max-w-6xl md:px-4"
		>
			<div className="w-full rounded-xl border shadow-sm">
				{/* Header */}
				<div className="border-b bg-gradient-to-r from-rose-50 to-orange-50 px-6 py-8 md:px-8">
					<TypographyH2 className="text-2xl font-bold md:text-3xl">
						Review your application
					</TypographyH2>
					<TypographyMuted className="mt-2 text-base">
						Check all your information below before submitting your application
					</TypographyMuted>
				</div>

				{/* Content */}
				<div className="space-y-6 px-2 py-6 md:p-8">
					<Tabs defaultValue="unit" className="w-full">
						<TabsList className="w-full">
							<TabsTrigger value="unit">Unit Details</TabsTrigger>
							<TabsTrigger value="user">Your Information</TabsTrigger>
						</TabsList>

						<TabsContent value="unit" className="mt-2">
							<Card className="max-md:border-none max-md:shadow-none">
								<CardHeader>
									<CardTitle>Property Overview</CardTitle>
									<CardDescription>
										Details of the unit you&apos;re applying for
									</CardDescription>
								</CardHeader>
								<CardContent>
									<UnitPreview unit={unit} />
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="user" className="mt-2">
							<Card className="max-md:border-none max-md:shadow-none">
								<CardHeader>
									<CardTitle>Your Information</CardTitle>
									<CardDescription>
										Review your personal and employment details below
									</CardDescription>
								</CardHeader>
								<CardContent>
									<UserPreview data={tenantApplicationData} />
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>

				{/* Actions */}
				<div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-6 md:flex-row md:justify-between md:px-8">
					<Link to="/">
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
						Confirm & Apply <ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</div>
		</form>
	)
}
