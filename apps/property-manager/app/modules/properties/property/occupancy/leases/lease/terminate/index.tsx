import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router'
import { LeaseTerminateProvider, useLeaseTerminate } from './context'
import { StepConfirm } from './steps/step4-confirm'
import { StepDocument } from './steps/step2-document'
import { StepInspection } from './steps/step1-inspection'
import { StepReason } from './steps/step0-reason'
import { StepSettlement } from './steps/step3-settlement'
import { useGetLeaseTerminations } from '~/api/lease-terminations'
import { Badge } from '~/components/ui/badge'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.occupancy.leases.$leaseId_.terminate'

const STEPS = [
	{ label: 'Reason' },
	{ label: 'Inspection' },
	{ label: 'Document' },
	{ label: 'Settlement' },
	{ label: 'Confirm' },
]

function LeaseTerminateContent({
	lease,
	propertyId,
}: {
	lease: Lease
	propertyId: string
}) {
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const navigate = useNavigate()
	const { step, setStep, terminationId, setTerminationId, next, back } =
		useLeaseTerminate()

	const { data: terminationsData } = useGetLeaseTerminations(
		clientId,
		propertyId,
		lease.id,
		{ filters: { status: 'InProgress' }, pagination: { page: 1, per: 1 } },
	)

	const existingInProgress = terminationsData?.rows?.[0] ?? null

	useEffect(() => {
		if (existingInProgress && !terminationId) {
			setTerminationId(existingInProgress.id)
		}
	}, [existingInProgress, terminationId, setTerminationId])

	const backToLease = `/properties/${propertyId}/occupancy/leases/${lease.id}`

	return (
		<main className="w-full">
			<div
				className="bg-rose-600 transition-all duration-300"
				style={{
					height: '3px',
					width: `${((step + 1) / STEPS.length) * 100}%`,
				}}
			/>

			<div className="mx-auto max-w-2xl px-4 py-8">
				<div className="mb-6">
					<Link
						to={backToLease}
						className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
					>
						<ArrowLeft className="size-4" />
						Back to {lease.code}
					</Link>
					<h1 className="mt-3 text-xl font-bold">Terminate Lease</h1>
					<p className="text-muted-foreground mt-0.5 text-sm">
						{lease.code} — complete each step to finalize the termination.
					</p>
				</div>

				{/* Step indicator */}
				<div className="mb-6 flex items-center gap-1">
					{STEPS.map((s, i) => (
						<div key={i} className="flex items-center gap-1">
							<button
								type="button"
								disabled={i > step && !terminationId}
								onClick={() =>
									i <= step || terminationId ? setStep(i) : undefined
								}
								className="flex flex-col items-center gap-0.5 disabled:opacity-40"
							>
								<Badge
									variant={
										i === step ? 'default' : i < step ? 'outline' : 'secondary'
									}
									className={`min-w-6 justify-center text-xs ${i < step ? 'border-teal-500 text-teal-600 dark:text-teal-400' : ''}`}
								>
									{i + 1}
								</Badge>
								<span
									className={`text-[10px] whitespace-nowrap ${i === step ? 'font-semibold' : 'text-muted-foreground'}`}
								>
									{s.label}
								</span>
							</button>
							{i < STEPS.length - 1 && (
								<div
									className={`h-px w-6 shrink-0 ${i < step ? 'bg-teal-500' : 'bg-border'}`}
								/>
							)}
						</div>
					))}
				</div>

				{/* Step content */}
				<div className="bg-card rounded-xl border shadow-none">
					{step === 0 && (
						<StepReason
							lease={lease}
							propertyId={propertyId}
							terminationId={terminationId}
							onTerminationCreated={setTerminationId}
							onNext={next}
						/>
					)}
					{step === 1 && terminationId && (
						<StepInspection
							lease={lease}
							propertyId={propertyId}
							terminationId={terminationId}
							onBack={back}
							onNext={next}
						/>
					)}
					{step === 2 && terminationId && (
						<StepDocument
							lease={lease}
							propertyId={propertyId}
							terminationId={terminationId}
							onBack={back}
							onNext={next}
						/>
					)}
					{step === 3 && terminationId && (
						<StepSettlement
							lease={lease}
							propertyId={propertyId}
							terminationId={terminationId}
							onBack={back}
							onNext={next}
						/>
					)}
					{step === 4 && terminationId && (
						<StepConfirm
							lease={lease}
							propertyId={propertyId}
							terminationId={terminationId}
							onBack={back}
							onDone={() => void navigate(backToLease)}
						/>
					)}
				</div>
			</div>
		</main>
	)
}

export function LeaseTerminateModule() {
	const { lease, clientUserProperty } = useLoaderData<typeof loader>()
	const propertyId = safeString(clientUserProperty?.property_id)

	if (!lease) return null

	return (
		<LeaseTerminateProvider>
			<LeaseTerminateContent lease={lease} propertyId={propertyId} />
		</LeaseTerminateProvider>
	)
}
