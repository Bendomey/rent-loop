import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useLocation, useParams } from 'react-router'
import ApproveTenantApplicationModal from '../approve'
import CancelTenantApplicationModal from '../cancel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { Progress } from '~/components/ui/progress'
import { localizedDayjs } from '~/lib/date'
import { cn } from '~/lib/utils'
import { useProperty } from '~/providers/property-provider'

const tenant: TenantApplication = {
	code: 'HAGSH12121',
	id: 't1',
	desired_move_in_date: new Date(),
	initial_deposit_currency: 'GHS',
	initial_deposit_fee: 5000,
	lease_agreement_document_mode: null,
	lease_agreement_document_property_manager_signed_at: null,
	lease_agreement_document_property_manager_signed_by: null,
	lease_agreement_document_tenant_signed_at: null,
	lease_agreement_document_property_manager_signed_by_id: null,
	lease_agreement_document_url: null,
	payment_frequency: 'MONTHLY',
	rent_fee: 5000,
	rent_fee_currency: 'GHS',
	security_deposit_fee: 0,
	security_deposit_fee_currency: 'GHS',
	stay_duration: null,
	stay_duration_frequency: null,
	on_boarding_method: 'ADMIN',
	first_name: 'Gideon',
	other_names: null,
	last_name: 'Bempong',
	email: 'gideon@example.com',
	phone: '(233) 277099230',
	gender: 'MALE',
	date_of_birth: '2001-01-01',
	nationality: 'Ghanaian',
	marital_status: 'SINGLE',
	profile_photo_url: null,
	id_type: 'PASSPORT',
	id_number: '14564464',
	id_front_url: null,
	id_back_url: null,
	status: 'TenantApplication.Status.InProgress',
	current_address: 'Osu, Accra',
	emergency_contact_name: 'John',
	emergency_contact_phone: '0277099230',
	relationship_to_emergency_contact: 'Father',
	employment_type: 'WORKER',
	occupation: 'Software Developer',
	employer: 'RENT-LOOP',
	occupation_address: 'Accra',
	proof_of_income_url: null,
	created_by: null,
	created_by_id: 'admin1',
	completed_at: null,
	completed_by_id: null,
	completed_by: null,
	cancelled_at: null,
	cancelled_by_id: null,
	cancelled_by: null,
	desired_unit_id: 'unit1',
	desired_unit: {
		id: 'unit1',
		name: 'Unit 103',
		rent_fee: 5000,
		rent_fee_currency: 'GHS',
		area: 2.33,
		description: 'Great office space',
		type: 'APARTMENT',
		features: {},
		tags: ['office'],
		images: [],
		payment_frequency: 'MONTHLY',
		slug: 'unit-103-u4y6yjjgns',
	},
	previous_landlord_name: null,
	previous_landlord_phone: null,
	previous_tenancy_period: null,
	created_at: new Date(),
	updated_at: new Date(),
}

export function PropertyTenantApplicationContainer() {
	const { applicationId } = useParams()
	const { clientUserProperty } = useProperty()
	const [openCancelModal, setOpenCancelModal] = useState(false)
	const [openApproveModal, setOpenApproveModal] = useState(false)

	const baseUrl = `/properties/${clientUserProperty?.property?.id}/tenants/applications/${applicationId}`
	return (
		<div className="m-5 grid grid-cols-12 gap-4">
			<div className="col-span-8">
				<div className="space-y-1">
					<div className="flex items-center space-x-3">
						<h1 className="text-3xl font-bold">Application Info #123242</h1>
						<Badge
							variant="secondary"
							className="bg-amber-400 px-2 py-1 text-xs text-amber-50"
						>
							In Progress
						</Badge>
					</div>
					<span className="text-sm text-gray-500">
						Submitted on <strong>{localizedDayjs().format('LLLL')}</strong>
					</span>
				</div>
				<div className="mt-5">
					<Outlet />
				</div>
			</div>
			<div className="col-span-4">
				{tenant.status === 'TenantApplication.Status.InProgress' ? (
					<div className="mb-3 flex w-full flex-row items-center justify-end space-x-2">
						<Button
							variant={'secondary'}
							onClick={() => setOpenCancelModal(true)}
						>
							Cancel
						</Button>
						<Button onClick={() => setOpenApproveModal(true)}>Approve</Button>
					</div>
				) : null}
				<Card key={tenant.id} className="mt-10 rounded-md shadow-none">
					<CardHeader>
						<CardTitle className="text-2xl font-bold">
							Complete Application Info
						</CardTitle>
						<CardDescription className="text-base">
							As you fill out the tenant application, your progress will be
							shown here.
						</CardDescription>
						<div className="mt-4 flex items-center gap-3 space-x-3">
							<span>40%</span>
							<Progress value={40} />
						</div>
					</CardHeader>

					<CardContent className="p-0">
						<MenuItem href={`${baseUrl}`} value={true} label="Select a unit" />
						<MenuItem
							href={`${baseUrl}/tenant-details`}
							value={true}
							label="Add tenants details"
						/>
						<MenuItem
							href={`${baseUrl}/move-in`}
							value={false}
							label="Move In Setup"
						/>
						<MenuItem
							href={`${baseUrl}/financial`}
							value={false}
							label="Add financial Setup"
						/>
						<MenuItem
							href={`${baseUrl}/docs`}
							value={false}
							label="Add lease docs setup"
						/>
					</CardContent>
				</Card>
			</div>
			<CancelTenantApplicationModal
				opened={openCancelModal}
				setOpened={setOpenCancelModal}
				data={tenant}
			/>
			<ApproveTenantApplicationModal
				opened={openApproveModal}
				setOpened={setOpenApproveModal}
				data={tenant}
			/>
		</div>
	)
}

interface MenuItemProps {
	label: string
	value: boolean
	href: string
}
function MenuItem({ label, value, href }: MenuItemProps) {
	const { pathname } = useLocation()

	const isActive = pathname === href
	return (
		<Link to={href} className="cursor-pointer">
			<div
				className={cn(
					'flex items-center space-x-3 px-5 py-2 hover:bg-gray-50',
					{
						'bg-gray-100 font-medium': isActive,
					},
				)}
			>
				<Checkbox checked={value} id="terms" />
				<Label className="text-base font-light">{label}</Label>
				<ChevronRight className="ml-auto h-5 w-auto text-gray-400" />
			</div>
		</Link>
	)
}
