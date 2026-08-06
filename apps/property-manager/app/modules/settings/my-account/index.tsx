import { useState } from 'react'
import { ProfileTab } from './components/profile-tab'
import RemovePhotoModal from './components/remove-photo'
import { SecurityTab } from './components/security-tab'
import { SessionsTab } from './components/sessions-tab'
import {
	SignOutAllSessionsModal,
	SignOutSessionModal,
} from './components/sign-out-session'
import UpdateClientProfileModal from './components/update-name'
import UpdatePasswordModal from './components/update-password'
import UploadPhotoModal from './components/upload-photo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { getNameInitials } from '~/lib/misc'
import { safeString } from '~/lib/strings'
import { useAuth } from '~/providers/auth-provider'

const TABS = [
	{ value: 'profile', label: 'Profile', sub: 'Photo, name and email' },
	{ value: 'security', label: 'Security', sub: 'Password and 2FA' },
	{ value: 'sessions', label: 'Sessions', sub: 'Signed-in devices' },
]

export function MyAccountSettingsModule() {
	const { currentUser } = useAuth()

	const [tab, setTab] = useState('profile')

	// Flows already wired to the API
	const [openUpdateClientProfileModal, setOpenUpdateClientProfileModal] =
		useState(false)
	const [openUpdatePasswordModal, setOpenUpdatePasswordModal] = useState(false)
	const [openUploadPhotoModal, setOpenUploadPhotoModal] = useState(false)
	const [openRemovePhotoModal, setOpenRemovePhotoModal] = useState(false)
	const [openSignOutAllModal, setOpenSignOutAllModal] = useState(false)
	const [sessionToSignOut, setSessionToSignOut] = useState<Session>()
	// How many others the confirm dialog should name. Set when opening it, from
	// the list the user is actually looking at.
	const [otherSessionCount, setOtherSessionCount] = useState(0)

	const name = safeString(currentUser?.name)
	const email = safeString(currentUser?.email)
	const initials = getNameInitials(name)
	const activeTab = TABS.find((t) => t.value === tab)

	console.log('currentUser?.profile_photo_url', currentUser)
	return (
		<div className="mx-auto max-w-4xl">
			<header>
				<h1 className="font-serif text-3xl tracking-tight">My Account</h1>
				<p className="text-muted-foreground mt-1.5 text-[15px]">
					Manage your personal details, how you sign in, and where you&rsquo;re
					signed in.
				</p>
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
						photoUrl={currentUser?.profile_photo_url}
						onChangeName={() => setOpenUpdateClientProfileModal(true)}
						onUploadPhoto={() => setOpenUploadPhotoModal(true)}
						onRemovePhoto={() => setOpenRemovePhotoModal(true)}
					/>
				</TabsContent>

				<TabsContent value="security">
					<SecurityTab
						onChangePassword={() => setOpenUpdatePasswordModal(true)}
					/>
				</TabsContent>

				<TabsContent value="sessions">
					<SessionsTab
						onSignOutOne={setSessionToSignOut}
						onSignOutAll={(others) => {
							setOtherSessionCount(others)
							setOpenSignOutAllModal(true)
						}}
					/>
				</TabsContent>
			</Tabs>

			<UpdateClientProfileModal
				opened={openUpdateClientProfileModal}
				setOpened={setOpenUpdateClientProfileModal}
				client={currentUser}
			/>
			<UpdatePasswordModal
				opened={openUpdatePasswordModal}
				setOpened={setOpenUpdatePasswordModal}
			/>

			<UploadPhotoModal
				opened={openUploadPhotoModal}
				setOpened={setOpenUploadPhotoModal}
				currentPhotoUrl={currentUser?.profile_photo_url}
			/>
			<RemovePhotoModal
				opened={openRemovePhotoModal}
				setOpened={setOpenRemovePhotoModal}
				initials={initials}
			/>
			<SignOutSessionModal
				session={sessionToSignOut}
				setSession={setSessionToSignOut}
			/>
			<SignOutAllSessionsModal
				opened={openSignOutAllModal}
				setOpened={setOpenSignOutAllModal}
				count={otherSessionCount}
			/>
		</div>
	)
}
