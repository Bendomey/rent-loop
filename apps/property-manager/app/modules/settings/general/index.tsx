import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { BrandingTab } from './components/branding-tab'
import { CompanyTab } from './components/company-tab'
import { EditBusinessTypeDialog } from './components/edit-business-type'
import { EditCompanyDetailsDialog } from './components/edit-company-details'
import { EditIdentityDialog } from './components/edit-identity'
import { EditLocationDialog } from './components/edit-location'
import { EditNameDialog } from './components/edit-name'
import { IdentityTab } from './components/identity-tab'
import { LocationTab } from './components/location-tab'
import { PreferencesTab } from './components/preferences-tab'
import { ProfileTab } from './components/profile-tab'
import { SwitchAccountTypeDialog } from './components/switch-account-type'
import { useGetClientUser } from '~/api/client-users'
import { Skeleton } from '~/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

/**
 * The flat stack of panels is now five categories behind a tab strip, matching
 * the My Account redesign. Company accounts get Company details; individual
 * accounts get Identity in the same slot.
 */
const COMPANY_TAB = {
	value: 'company',
	label: 'Company',
	sub: 'Description, registration and support contacts',
}

const IDENTITY_TAB = {
	value: 'identity',
	label: 'Identity',
	sub: 'Your government-issued identification',
}

const BASE_TABS = {
	profile: {
		value: 'profile',
		label: 'Profile',
		sub: 'Account name and ownership type',
	},
	location: {
		value: 'location',
		label: 'Location',
		sub: 'Your official physical address',
	},
	branding: {
		value: 'branding',
		label: 'Branding',
		sub: 'Logo and document accent colour',
	},
	preferences: {
		value: 'preferences',
		label: 'Preferences',
		sub: 'Currency, time zone, date format and language',
	},
}

type DialogKey =
	| 'name'
	| 'businessType'
	| 'switchType'
	| 'company'
	| 'location'
	| 'identity'

export function GeneralSettingsModule() {
	const queryClient = useQueryClient()
	const { clientUser: clientUserServer } = useClient()
	const { data: currentUser } = useGetClientUser(
		safeString(clientUserServer?.client_id),
		safeString(clientUserServer?.user_id),
		clientUserServer,
	)

	const [tab, setTab] = useState('profile')
	const [dialog, setDialog] = useState<DialogKey>()

	const client = currentUser?.client
	const isCompany = client?.type === 'COMPANY'

	const tabs = [
		BASE_TABS.profile,
		isCompany ? COMPANY_TAB : IDENTITY_TAB,
		BASE_TABS.location,
		BASE_TABS.branding,
		BASE_TABS.preferences,
	]
	// Switching account type swaps Company for Identity, so fall back to the
	// first tab rather than stranding the user on one that no longer exists.
	const activeTab = tabs.find((t) => t.value === tab) ?? BASE_TABS.profile

	const closeDialog = () => setDialog(undefined)

	const handleMutationSuccess = () => {
		closeDialog()
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.CLIENT_USER, safeString(currentUser?.id)],
		})
	}

	return (
		<div className="mx-auto max-w-4xl">
			<header>
				<h1 className="font-serif text-3xl tracking-tight">General Settings</h1>
				<p className="text-muted-foreground mt-1.5 text-[15px]">
					Update and manage your essential information.
				</p>
			</header>

			<Tabs value={activeTab.value} onValueChange={setTab} className="mt-6">
				<TabsList>
					{tabs.map((t) => (
						<TabsTrigger key={t.value} value={t.value}>
							{t.label}
						</TabsTrigger>
					))}
				</TabsList>

				<p className="text-muted-foreground mt-3 mb-5 text-sm">
					{activeTab.sub}
				</p>

				{client ? (
					<>
						<TabsContent value="profile">
							<ProfileTab
								client={client}
								onChangeName={() => setDialog('name')}
								onChangeBusinessType={() => setDialog('businessType')}
								onSwitchType={() => setDialog('switchType')}
							/>
						</TabsContent>

						<TabsContent value="company">
							<CompanyTab client={client} onEdit={() => setDialog('company')} />
						</TabsContent>

						<TabsContent value="identity">
							<IdentityTab
								client={client}
								onEdit={() => setDialog('identity')}
							/>
						</TabsContent>

						<TabsContent value="location">
							<LocationTab
								client={client}
								onEdit={() => setDialog('location')}
							/>
						</TabsContent>
					</>
				) : (
					<Skeleton className="h-64 w-full rounded-xl" />
				)}

				{/* Neither of these reads the client — they have no API yet. */}
				<TabsContent value="branding">
					<BrandingTab />
				</TabsContent>

				<TabsContent value="preferences">
					<PreferencesTab />
				</TabsContent>
			</Tabs>

			{client ? (
				<>
					<EditNameDialog
						client={client}
						open={dialog === 'name'}
						onOpenChange={closeDialog}
						onSuccess={handleMutationSuccess}
					/>

					<SwitchAccountTypeDialog
						client={client}
						open={dialog === 'switchType'}
						onOpenChange={closeDialog}
						onSuccess={handleMutationSuccess}
					/>

					<EditLocationDialog
						client={client}
						open={dialog === 'location'}
						onOpenChange={closeDialog}
						onSuccess={handleMutationSuccess}
					/>

					{isCompany ? (
						<>
							<EditBusinessTypeDialog
								client={client}
								open={dialog === 'businessType'}
								onOpenChange={closeDialog}
								onSuccess={handleMutationSuccess}
							/>
							<EditCompanyDetailsDialog
								client={client}
								open={dialog === 'company'}
								onOpenChange={closeDialog}
								onSuccess={handleMutationSuccess}
							/>
						</>
					) : (
						<EditIdentityDialog
							client={client}
							open={dialog === 'identity'}
							onOpenChange={closeDialog}
							onSuccess={handleMutationSuccess}
						/>
					)}
				</>
			) : null}
		</div>
	)
}
