import { useState } from 'react'
import { ProfileTab } from './components/profile-tab'
import { SecurityTab } from './components/security-tab'
import { SessionsTab } from './components/sessions-tab'
import UpdateEmailModal from './components/update-email'
import UpdateNameModal from './components/update-name'
import UpdatePasswordModal from './components/update-password'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { getNameInitials } from '~/lib/misc'
import { safeString } from '~/lib/strings'
import { useAuth } from '~/providers/auth-provider'

const TABS = [
	{ value: 'profile', label: 'Profile', sub: 'Photo, name and email' },
	{ value: 'security', label: 'Security', sub: 'Password and 2FA' },
	{ value: 'sessions', label: 'Sessions', sub: 'Signed-in devices' },
]

export function SettingsModule() {
	const { currentUser } = useAuth()
	const [tab, setTab] = useState('profile')
	const [openUpdateNameModal, setOpenUpdateNameModal] = useState(false)
	const [openUpdateEmailModal, setOpenUpdateEmailModal] = useState(false)
	const [openUpdatePasswordModal, setOpenUpdatePasswordModal] = useState(false)

	const name = safeString(currentUser?.name)
	const email = safeString(currentUser?.email)
	const initials = getNameInitials(name)
	const activeTab = TABS.find((t) => t.value === tab)

	return (
		<main className="px-4 py-8 md:px-8">
			<div className="mx-auto max-w-4xl">
				<header>
					<TypographyH2>My Account</TypographyH2>
					<TypographyMuted className="mt-1.5">
						Manage your personal details, how you sign in, and where
						you&rsquo;re signed in.
					</TypographyMuted>
				</header>

				<Tabs value={tab} onValueChange={setTab} className="mt-6">
					<TabsList>
						{TABS.map((t) => (
							<TabsTrigger key={t.value} value={t.value}>
								{t.label}
							</TabsTrigger>
						))}
					</TabsList>

					<p className="text-muted-foreground mt-3 mb-5 text-sm">
						{activeTab?.sub}
					</p>

					<TabsContent value="profile">
						<ProfileTab
							name={name}
							email={email}
							initials={initials}
							onChangeName={() => setOpenUpdateNameModal(true)}
							onChangeEmail={() => setOpenUpdateEmailModal(true)}
						/>
					</TabsContent>

					<TabsContent value="security">
						<SecurityTab
							onChangePassword={() => setOpenUpdatePasswordModal(true)}
						/>
					</TabsContent>

					<TabsContent value="sessions">
						<SessionsTab />
					</TabsContent>
				</Tabs>

				<UpdateNameModal
					name={name}
					opened={openUpdateNameModal}
					setOpened={setOpenUpdateNameModal}
				/>
				<UpdateEmailModal
					email={email}
					opened={openUpdateEmailModal}
					setOpened={setOpenUpdateEmailModal}
				/>
				<UpdatePasswordModal
					opened={openUpdatePasswordModal}
					setOpened={setOpenUpdatePasswordModal}
				/>
			</div>
		</main>
	)
}
