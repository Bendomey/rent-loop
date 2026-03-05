import type { ColumnDef } from '@tanstack/react-table'
import { Building, EllipsisVertical } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { TenantPaymentSectionCards } from './cards'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import { formatAmount } from '~/lib/format-amount'
import { useProperty } from '~/providers/property-provider'

interface Props {
	data: Invoice
	isLoading?: boolean
	error?: string
	refetch?: () => void
}

export function PropertyFinancialsPaymentItemsModule({
	data,
	isLoading,
	error,
	refetch,
}: Props) {
	const { clientUserProperty } = useProperty()

	return (
		<div className="mx-auto my-2 flex flex-col gap-4 sm:gap-6">
			<div className="space-y-1">
				<TypographyH4>All Payments</TypographyH4>
				<TypographyMuted>
					Monitor invoice payments, and manage overdue balances efficiently.
				</TypographyMuted>
			</div>

			<TenantPaymentSectionCards data={data} />

			<div className="bg-background space-y-5 rounded-lg border p-3 sm:p-5">
				<div className="h-full w-full">
					{/* ToDo: Add payment details here, such as payment method, date, amount, and status.  */}
				</div>
			</div>
		</div>
	)
}
