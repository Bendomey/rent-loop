import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight } from 'lucide-react'
import { useState } from 'react'
import { RestoreConfirmModal } from './confirm-modal'
import { RestoreDoneModal } from './done-modal'
import { Button } from '~/components/ui/button'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

type Stage = 'idle' | 'confirming' | 'done'

interface Props {
	property: Property
	refetch: VoidFunction
}

export function RestoreFlow({ property, refetch }: Props) {
	const { clientUser } = useClient()
	const [stage, setStage] = useState<Stage>('idle')
	const queryClient = useQueryClient()

	const open = () => setStage('confirming')
	const close = () => setStage('idle')

	// Only invalidate once the success modal is dismissed — invalidating
	// right after the restore call succeeds would refetch the archived
	// list immediately, removing this row (and its modal) from the DOM
	// before the user ever sees the success state.
	const closeDone = () => {
		close()
		refetch()
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.PROPERTIES],
		})
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.CURRENT_USER, QUERY_KEYS.PROPERTIES],
		})
		void queryClient.invalidateQueries({
			queryKey: [QUERY_KEYS.CLIENT_USER_PROPERTIES],
		})
	}

	return (
		<>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="gap-1.5"
				onClick={open}
			>
				<ArrowLeftRight className="size-3.5" />
				Restore
			</Button>

			{stage === 'confirming' ? (
				<RestoreConfirmModal
					clientId={safeString(clientUser?.client_id)}
					propertyId={property.id}
					propertyName={property.name}
					opened
					setOpened={close}
					onRestored={() => setStage('done')}
				/>
			) : null}

			{stage === 'done' ? (
				<RestoreDoneModal
					propertyId={property.id}
					propertyName={property.name}
					opened
					setOpened={closeDone}
				/>
			) : null}
		</>
	)
}
