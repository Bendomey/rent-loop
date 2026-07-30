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
import { PLACEHOLDER_SESSIONS, type AccountSession } from './placeholder-data'
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

	// New UI — nothing behind these yet
	const [openUploadPhotoModal, setOpenUploadPhotoModal] = useState(false)
	const [openRemovePhotoModal, setOpenRemovePhotoModal] = useState(false)
	const [openSignOutAllModal, setOpenSignOutAllModal] = useState(false)
	const [sessionToSignOut, setSessionToSignOut] = useState<AccountSession>()
	const [sessions, setSessions] =
		useState<AccountSession[]>(PLACEHOLDER_SESSIONS)

	const name = safeString(currentUser?.name)
	const email = safeString(currentUser?.email)
	const initials = getNameInitials(name)
	const activeTab = TABS.find((t) => t.value === tab)

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
						sessions={sessions}
						onSignOutOne={setSessionToSignOut}
						onSignOutAll={() => setOpenSignOutAllModal(true)}
					/>
				</TabsContent>
			</Tabs>

			{/* Existing, API-backed flows */}
			<UpdateClientProfileModal
				opened={openUpdateClientProfileModal}
				setOpened={setOpenUpdateClientProfileModal}
				client={currentUser}
			/>
			<UpdatePasswordModal
				opened={openUpdatePasswordModal}
				setOpened={setOpenUpdatePasswordModal}
			/>

			{/* New UI, not yet wired to the API */}
			<UploadPhotoModal
				opened={openUploadPhotoModal}
				setOpened={setOpenUploadPhotoModal}
			/>
			<RemovePhotoModal
				opened={openRemovePhotoModal}
				setOpened={setOpenRemovePhotoModal}
				initials={initials}
			/>
			<SignOutSessionModal
				session={sessionToSignOut}
				setSession={setSessionToSignOut}
				onConfirm={(session) => {
					setSessions((prev) => prev.filter((s) => s.id !== session.id))
					setSessionToSignOut(undefined)
				}}
			/>
			<SignOutAllSessionsModal
				opened={openSignOutAllModal}
				setOpened={setOpenSignOutAllModal}
				count={sessions.filter((s) => !s.current).length}
				onConfirm={() => {
					setSessions((prev) => prev.filter((s) => s.current))
					setOpenSignOutAllModal(false)
				}}
			/>
		</div>
	)
}
