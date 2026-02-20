import { Check, ChevronRight, X } from 'lucide-react'
import { Link, useLocation } from 'react-router'
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '~/components/ui/tooltip'
import { cn } from '~/lib/utils'

interface SubItem {
    label: string
    done: boolean
}

interface Props {
    application: TenantApplication
}

export function PropertyTenantApplicationChecklist({ application }: Props) {
    const baseUrl = `/properties/${application.desired_unit?.property_id}/tenants/applications/${application.id}`

    const unitItems: SubItem[] = [
        { label: 'Unit selected', done: Boolean(application.desired_unit) },
    ]

    const tenantDetailItems: SubItem[] = [
        { label: 'First name', done: Boolean(application.first_name) },
        { label: 'Last name', done: Boolean(application.last_name) },
        { label: 'Email', done: Boolean(application.email) },
        { label: 'Phone', done: Boolean(application.phone) },
        { label: 'Gender', done: Boolean(application.gender) },
        { label: 'Date of birth', done: Boolean(application.date_of_birth) },
        { label: 'Nationality', done: Boolean(application.nationality) },
        { label: 'Marital status', done: Boolean(application.marital_status) },
        { label: 'ID type', done: Boolean(application.id_type) },
        { label: 'ID number', done: Boolean(application.id_number) },
        { label: 'Current address', done: Boolean(application.current_address) },
        { label: 'Emergency contact name', done: Boolean(application.emergency_contact_name) },
        { label: 'Emergency contact phone', done: Boolean(application.emergency_contact_phone) },
        { label: 'Relationship to emergency contact', done: Boolean(application.relationship_to_emergency_contact) },
        { label: 'Employment type', done: Boolean(application.employer_type) },
        { label: 'Occupation', done: Boolean(application.occupation) },
        { label: 'Employer', done: Boolean(application.employer) },
        { label: 'Occupation address', done: Boolean(application.occupation_address) },
    ]

    const moveInItems: SubItem[] = [
        { label: 'Move-in date', done: Boolean(application.desired_move_in_date) },
        { label: 'Stay duration frequency', done: Boolean(application.stay_duration_frequency) },
        { label: 'Stay duration', done: Boolean(application.stay_duration) },
    ]

    const financialItems: SubItem[] = [
        { label: 'Rent fee', done: Boolean(application.rent_fee) },
        { label: 'Rent fee currency', done: Boolean(application.rent_fee_currency) },
        { label: 'Payment frequency', done: Boolean(application.payment_frequency) },
        { label: 'Initial deposit', done: Boolean(application.initial_deposit_fee) },
        { label: 'Initial deposit currency', done: Boolean(application.initial_deposit_currency) },
    ]

    const signatures = application.lease_agreement_document_signatures ?? []
    const managerSig = signatures.find(s => s.role === 'PROPERTY_MANAGER')
    const tenantSig = signatures.find(s => s.role === 'TENANT')
    const witnessSigs = signatures.filter(
        s => s.role === 'PM_WITNESS' || s.role === 'TENANT_WITNESS',
    )

    const docsItems: SubItem[] = [
        { label: 'Document mode', done: Boolean(application.lease_agreement_document_mode) },
        {
            label: 'Document uploaded',
            done: application.lease_agreement_document_mode === 'ONLINE'
                ? Boolean(application.lease_agreement_document_id)
                : Boolean(application.lease_agreement_document_url),
        },
        { label: 'Manager signed', done: Boolean(managerSig) },
        { label: 'Tenant signed', done: Boolean(tenantSig) },
        ...witnessSigs.map(s => ({
            label: `Witness signed (${s.role === 'PM_WITNESS' ? 'PM' : 'Tenant'})`,
            done: true,
        })),
    ]

    const checklistSections = [unitItems, tenantDetailItems, moveInItems, financialItems, docsItems]
    const sectionsComplete = checklistSections.filter(items => items.every(i => i.done)).length
    const progress = (sectionsComplete / checklistSections.length) * 100

    return (
        <Card className="mt-10 rounded-md shadow-none">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">
                    Complete Application Info
                </CardTitle>
                <CardDescription className="text-base">
                    As you fill out the tenant application, your progress will be
                    shown here.
                </CardDescription>
                <div className="mt-4 flex items-center gap-3 space-x-3">
                    <span>{Math.round(progress)}%</span>
                    <Progress value={progress} />
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <MenuItem href={`${baseUrl}`} subItems={unitItems} label="Select a unit" />
                <MenuItem
                    href={`${baseUrl}/tenant-details`}
                    subItems={tenantDetailItems}
                    label="Add tenants details"
                />
                <MenuItem
                    href={`${baseUrl}/move-in`}
                    subItems={moveInItems}
                    label="Move In Setup"
                />
                <MenuItem
                    href={`${baseUrl}/financial`}
                    subItems={financialItems}
                    label="Add financial Setup"
                />
                <MenuItem
                    href={`${baseUrl}/docs`}
                    subItems={docsItems}
                    label="Add lease docs setup"
                />
            </CardContent>
        </Card>
    )
}

interface MenuItemProps {
    label: string
    subItems: SubItem[]
    href: string
}
function MenuItem({ label, subItems, href }: MenuItemProps) {
    const { pathname } = useLocation()

    const isActive = pathname === href
    const doneCount = subItems.filter(i => i.done).length
    const allDone = doneCount === subItems.length

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
                <Checkbox checked={allDone} />
                <Label className="text-base font-light">{label}</Label>
                <div className="ml-auto flex items-center gap-2">
                    {
                        isActive ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-xs font-medium',
                                            allDone
                                                ? 'bg-green-100 text-green-700'
                                                : doneCount > 0
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-gray-100 text-gray-600',
                                        )}
                                    >
                                        {doneCount}/{subItems.length}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs p-3">
                                    <ul className="space-y-1">
                                        {subItems.map((item) => (
                                            <li
                                                key={item.label}
                                                className="flex items-center gap-2 text-xs"
                                            >
                                                {item.done ? (
                                                    <Check className="h-3 w-3 text-green-400" />
                                                ) : (
                                                    <X className="h-3 w-3 text-red-400" />
                                                )}
                                                <span>{item.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </TooltipContent>
                            </Tooltip>
                        ) : null
                    }
                    <ChevronRight className="h-5 w-auto text-gray-400" />
                </div>
            </div>
        </Link>
    )
}
