import { useState } from 'react'
import ActivateClientUserModal from './activate'
import DeactivateClientUserModal from './deactivate'
import { DropdownMenuItem } from '~/components/ui/dropdown-menu'

export const ClientUserStatus = ({
	refetch,
	clientUser,
}: {
	clientUser: ClientUser
	refetch: any
}) => {
	const [openDeactivationModal, setOpenDeactivationModal] = useState(false)
	const [openActivationModal, setOpenActivationModal] = useState(false)

	const isActive = clientUser.status === 'ClientUser.Status.Active'

	const handleChange = () => {
		if (isActive) {
			setOpenDeactivationModal(true)
		} else {
			setOpenActivationModal(true)
		}
	}

	return (
		<>
			<DropdownMenuItem
				onSelect={(e) => e.preventDefault()}
				onClick={handleChange}
				className={isActive ? undefined : 'bg-green-300 focus:bg-green-400'}
				variant={isActive ? 'destructive' : 'default'}
			>
				{isActive ? 'Deactivate' : 'Activate'}
			</DropdownMenuItem>
			<DeactivateClientUserModal
				opened={openDeactivationModal}
				setOpened={setOpenDeactivationModal}
				refetch={refetch}
				data={clientUser}
			/>
			<ActivateClientUserModal
				opened={openActivationModal}
				setOpened={setOpenActivationModal}
				refetch={refetch}
				data={clientUser}
			/>
		</>
	)
}
