import { useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, ShieldOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { toast } from 'sonner'
import {
	linkClientUserToProperties,
	unlinkClientUserFromProperties,
	useGetClientUserProperties,
} from '~/api/client-user-properties'
import { useDeleteClientUser, useGetClientUsers } from '~/api/client-users'
import { useGetMyProperties } from '~/api/properties'
import { MultiSelect } from '~/components/multi-select'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Skeleton } from '~/components/ui/skeleton'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { CUSTOMER_SUPPORT_ACCOUNT, QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

type SupportAccessState = 'none' | 'revoked' | 'active'

export function CustomerSupportAccessModule() {
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const queryClient = useQueryClient()

	const { data: supportUsers, isPending: isLoadingSupportUser } =
		useGetClientUsers(clientId, {
			filters: { user_email: CUSTOMER_SUPPORT_ACCOUNT.EMAIL },
			pagination: { page: 1, per: 1 },
			populate: ['User'],
		})

	const supportMember = supportUsers?.rows?.[0]
	const memberId = supportMember?.id
	const isActive = supportMember?.status === 'ClientUser.Status.Active'
	const state: SupportAccessState = !supportMember
		? 'none'
		: isActive
			? 'active'
			: 'revoked'

	const { data: supportProperties } = useGetClientUserProperties(
		memberId ? clientId : '',
		{
			filters: { client_user_id: memberId },
			pagination: { page: 1, per: 100 },
			populate: ['Property'],
		},
	)
	const grantedPropertyIds =
		supportProperties?.rows?.map((row) => row.property_id) ?? []

	const { data: myProperties } = useGetMyProperties(clientId, {
		pagination: { page: 1, per: 100 },
		populate: ['Property'],
		sorter: { sort: 'asc', sort_by: 'created_at' },
	})
	const propertyOptions = (myProperties?.rows ?? [])
		.filter((item) => !!item.property)
		.map((item) => ({ label: item.property!.name, value: item.property_id }))

	const invalidateSupportQueries = () => {
		void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENT_USERS] })
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.CLIENT_USER_PROPERTIES],
		})
	}

	// Grant form (states: none / revoked)
	const [consentChecked, setConsentChecked] = useState(false)
	const [formPropertyIds, setFormPropertyIds] = useState<string[]>([])
	const grantFetcher = useFetcher<{ error?: string; success?: boolean }>()
	const isGranting = grantFetcher.state !== 'idle'

	useEffect(() => {
		if (grantFetcher.state !== 'idle' || !grantFetcher.data) return

		if (grantFetcher.data.error) {
			toast.error(grantFetcher.data.error)
			return
		}

		if (grantFetcher.data.success) {
			toast.success('Access granted to RentLoop Support')
			setConsentChecked(false)
			setFormPropertyIds([])
			invalidateSupportQueries()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [grantFetcher.state, grantFetcher.data])

	const handleGrant = () => {
		void grantFetcher.submit(
			{
				existing_member_id: state === 'revoked' ? safeString(memberId) : '',
				property_ids: JSON.stringify(formPropertyIds),
			},
			{ method: 'POST', action: '/settings/customer-support-access' },
		)
	}

	// Active-state property management — edits are staged locally and only
	// applied when "Save Changes" is clicked.
	const [pendingPropertyIds, setPendingPropertyIds] = useState<string[]>([])
	const [isSavingProperties, setIsSavingProperties] = useState(false)

	useEffect(() => {
		setPendingPropertyIds(grantedPropertyIds)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [[...grantedPropertyIds].sort().join(',')])

	const hasPendingPropertyChanges =
		[...pendingPropertyIds].sort().join(',') !==
		[...grantedPropertyIds].sort().join(',')

	// Revoke all access — deleting the client user (rather than deactivating
	// it) means a future grant creates a fresh membership instead of having
	// to reactivate a suspended one.
	const [revokeAllOpen, setRevokeAllOpen] = useState(false)
	const { mutateAsync: deleteMember, isPending: isRevokingAll } =
		useDeleteClientUser()

	const revokeAll = async () => {
		if (!memberId) return
		await deleteMember({ clientId, id: memberId, deleteProperties: true })
		toast.success('Customer support access revoked')
		invalidateSupportQueries()
	}

	const handleRevokeAll = async () => {
		try {
			await revokeAll()
			setRevokeAllOpen(false)
		} catch {
			toast.error('Failed to revoke access. Please try again.')
		}
	}

	// Removing every property and saving is equivalent to revoking all access.
	const handleSaveProperties = async () => {
		if (!memberId) return

		setIsSavingProperties(true)
		try {
			if (pendingPropertyIds.length === 0) {
				await revokeAll()
			} else {
				const added = pendingPropertyIds.filter(
					(id) => !grantedPropertyIds.includes(id),
				)
				const removed = grantedPropertyIds.filter(
					(id) => !pendingPropertyIds.includes(id),
				)

				if (added.length > 0) {
					await linkClientUserToProperties({
						clientId,
						client_user_id: memberId,
						property_ids: added,
						role: 'MANAGER',
					})
				}
				if (removed.length > 0) {
					await unlinkClientUserFromProperties({
						clientId,
						client_user_id: memberId,
						property_ids: removed,
					})
				}
				toast.success('Access updated')
				invalidateSupportQueries()
			}
		} catch {
			toast.error('Failed to update access. Please try again.')
		} finally {
			setIsSavingProperties(false)
		}
	}

	if (isLoadingSupportUser) {
		return (
			<div className="flex flex-col gap-6">
				<div className="space-y-2">
					<Skeleton className="h-5 w-64" />
					<Skeleton className="h-4 w-full max-w-md" />
				</div>
				<div className="flex flex-col gap-4 rounded-md border p-4">
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<TypographyH4>Customer Support Access</TypographyH4>
				<TypographyMuted>
					Give RentLoop Support temporary access to your workspace so we can
					help debug issues faster — without you ever sharing your login
					credentials.
				</TypographyMuted>
			</div>

			{state === 'active' ? (
				<div className="flex flex-col gap-4 rounded-md border p-4">
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="bg-teal-500 text-white">
							<ShieldCheck className="size-3.5" />
							Access Granted
						</Badge>
					</div>

					<TypographyMuted>
						Rentloop Support can manage the properties below, as if they were a
						manager on your team.
					</TypographyMuted>
					<div className="space-y-1.5">
						<label className="text-sm font-medium">Granted Properties</label>
						<MultiSelect
							options={propertyOptions}
							defaultValue={pendingPropertyIds}
							onValueChange={setPendingPropertyIds}
							placeholder="Select properties"
							disabled={isSavingProperties}
							hideSelectAll
						/>
						<p className="text-muted-foreground text-xs">
							{pendingPropertyIds.length === 0
								? 'Removing every property and saving will revoke all access.'
								: 'Add or remove properties, then save to apply the changes.'}
						</p>
					</div>
					<div className="flex justify-between">
						<Button
							type="button"
							variant="destructive"
							size="sm"
							onClick={() => setRevokeAllOpen(true)}
						>
							<ShieldOff className="size-4" />
							Revoke All Access
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={() => void handleSaveProperties()}
							disabled={isSavingProperties || !hasPendingPropertyChanges}
							className="bg-rose-600 hover:bg-rose-700"
						>
							{isSavingProperties ? <Spinner /> : null} Save Changes
						</Button>
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-4 rounded-md border p-4">
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="text-muted-foreground">
							<X className="size-3.5" />
							Not Granted
						</Badge>
					</div>

					<TypographyMuted>
						Granting access adds{' '}
						<span className="font-medium">
							{CUSTOMER_SUPPORT_ACCOUNT.EMAIL}
						</span>{' '}
						as a limited member of your workspace, with manager-level access to
						only the properties you select below. You can revoke this access —
						entirely, or one property at a time — at any point from this same
						page.
					</TypographyMuted>

					<div className="space-y-1.5">
						<label className="text-sm font-medium">
							Select properties to share access to
						</label>
						<MultiSelect
							options={propertyOptions}
							defaultValue={formPropertyIds}
							onValueChange={setFormPropertyIds}
							placeholder="Select properties"
							disabled={isGranting}
							hideSelectAll
						/>
					</div>

					<label className="flex items-start gap-2 text-sm">
						<Checkbox
							checked={consentChecked}
							onCheckedChange={(checked) => setConsentChecked(checked === true)}
							disabled={isGranting}
						/>
						<span>
							I understand and consent to grant RentLoop Support temporary
							access to the properties selected above.
						</span>
					</label>

					<div className="flex justify-end">
						<Button
							type="button"
							onClick={handleGrant}
							disabled={
								isGranting || !consentChecked || formPropertyIds.length === 0
							}
							className="bg-rose-600 hover:bg-rose-700"
						>
							{isGranting ? <Spinner /> : null} Grant Access
						</Button>
					</div>
				</div>
			)}

			<AlertDialog open={revokeAllOpen} onOpenChange={setRevokeAllOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Revoke All Access</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove RentLoop Support&apos;s access to all properties
							in your workspace. You can grant access again at any time.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isRevokingAll}
							onClick={() => setRevokeAllOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={isRevokingAll}
							onClick={() => void handleRevokeAll()}
						>
							{isRevokingAll ? <Spinner /> : null} Yes, Revoke All
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
