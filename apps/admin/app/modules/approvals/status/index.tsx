import { CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'
import ApproveApplicationModal from './approve'
import RejectApplicationModal from './reject'
import { Button } from '~/components/ui/button'

export const ApplicationStatus = ({
	application,
}: {
	application: ClientApplication
}) => {
	const [openApprove, setOpenApprove] = useState(false)
	const [openReject, setOpenReject] = useState(false)

	if (application.status !== 'ClientApplication.Status.Pending') return null

	return (
		<>
			<div className="flex items-center gap-2">
				<Button
					size="sm"
					variant="outline"
					className="h-7 border-teal-600 text-teal-700 hover:bg-teal-50 dark:border-teal-500 dark:text-teal-400 dark:hover:bg-teal-950"
					onClick={() => setOpenApprove(true)}
				>
					<CheckCircle className="size-3.5" />
					Approve
				</Button>
				<Button
					size="sm"
					variant="outline"
					className="h-7 border-rose-600 text-rose-700 hover:bg-rose-50 dark:border-rose-500 dark:text-rose-400 dark:hover:bg-rose-950"
					onClick={() => setOpenReject(true)}
				>
					<XCircle className="size-3.5" />
					Reject
				</Button>
			</div>

			<ApproveApplicationModal
				data={application}
				opened={openApprove}
				setOpened={setOpenApprove}
			/>
			<RejectApplicationModal
				data={application}
				opened={openReject}
				setOpened={setOpenReject}
			/>
		</>
	)
}
