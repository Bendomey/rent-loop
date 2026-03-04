import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRevalidator } from 'react-router'

import { lexicalToPdf } from './lexical-to-pdf'
import { uploadPdfToR2 } from './upload-pdf'
import {
	useAdminUpdateTenantApplication,
	useApproveTenantApplication,
} from '~/api/tenant-applications'
import { useNavigationBlocker } from '~/hooks/use-navigation-blocker'
import { QUERY_KEYS } from '~/lib/constants'
import {
	buildTemplateFieldMap,
	resolveTemplateFields,
} from '~/lib/resolve-template-fields'

type ApprovalStep =
	| 'GENERATE_PDF'
	| 'UPLOAD_PDF'
	| 'UPDATE_APPLICATION'
	| 'APPROVE'

type PipelineState =
	| { status: 'IDLE' }
	| { status: 'PROCESSING'; currentStep: ApprovalStep; progress: number }
	| { status: 'ERROR'; failedStep: ApprovalStep; error: string }
	| { status: 'SUCCESS' }

const STEP_DESCRIPTIONS: Record<ApprovalStep, string> = {
	GENERATE_PDF: 'Preparing your documents...',
	UPLOAD_PDF: 'Securely saving your files...',
	UPDATE_APPLICATION: 'Updating application records...',
	APPROVE: 'Finalizing the approval...',
}

interface UseApprovalPipelineProps {
	application: TenantApplication
	onSuccess: () => void
}

export function useApprovalPipeline({
	application,
	onSuccess,
}: UseApprovalPipelineProps) {
	const [state, setState] = useState<PipelineState>({ status: 'IDLE' })
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()
	const { mutateAsync: updateApplication } = useAdminUpdateTenantApplication()
	const { mutateAsync: approveApplication } = useApproveTenantApplication()
	const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	)

	const isProcessing = state.status === 'PROCESSING'
	useNavigationBlocker(
		isProcessing,
		'The approval process is still running. Leaving now may cause issues.',
	)

	const hasLeaseDocument =
		application.lease_agreement_document_mode === 'ONLINE' &&
		application.lease_agreement_document != null &&
		application.lease_agreement_document.content != null

	const hasExistingPdfUrl =
		application.lease_agreement_document_url != null

	const steps: ApprovalStep[] =
		hasLeaseDocument && !hasExistingPdfUrl
			? ['GENERATE_PDF', 'UPLOAD_PDF', 'UPDATE_APPLICATION', 'APPROVE']
			: ['APPROVE']

	const stepRanges = useMemo(() => {
		const stepSize = 100 / steps.length
		const ranges: Record<string, { start: number; end: number }> = {}
		for (let i = 0; i < steps.length; i++) {
			const step = steps[i]
			if (step) {
				ranges[step] = {
					start: i * stepSize,
					end: (i + 1) * stepSize,
				}
			}
		}
		return ranges
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasLeaseDocument, hasExistingPdfUrl])

	useEffect(() => {
		return () => {
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current)
			}
		}
	}, [])

	const startFakeProgress = useCallback(
		(step: ApprovalStep) => {
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current)
			}

			const range = stepRanges[step]
			if (!range) return
			const targetMax = range.end - 2

			progressIntervalRef.current = setInterval(() => {
				setState((prev) => {
					if (prev.status !== 'PROCESSING') return prev
					const remaining = targetMax - prev.progress
					const increment = Math.max(remaining * 0.08, 0.1)
					const newProgress = Math.min(prev.progress + increment, targetMax)
					return { ...prev, progress: newProgress }
				})
			}, 200)
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[JSON.stringify(stepRanges)],
	)

	const completeStep = useCallback(
		(step: ApprovalStep) => {
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current)
				progressIntervalRef.current = null
			}
			const range = stepRanges[step]
			if (!range) return
			setState((prev) => {
				if (prev.status !== 'PROCESSING') return prev
				return { ...prev, progress: range.end }
			})
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[JSON.stringify(stepRanges)],
	)

	const beginStep = useCallback(
		(step: ApprovalStep) => {
			const range = stepRanges[step]
			if (!range) return
			setState({
				status: 'PROCESSING',
				currentStep: step,
				progress: range.start,
			})
			startFakeProgress(step)
		},
		[stepRanges, startFakeProgress],
	)

	const runPipeline = useCallback(async () => {
		let pdfUrl: string | undefined

		try {
			if (hasLeaseDocument && !hasExistingPdfUrl) {
				const doc = application.lease_agreement_document!

				// Step 1: Generate PDF
				beginStep('GENERATE_PDF')
				const templateFieldMap = buildTemplateFieldMap(application)
				const parsedEditorState = JSON.parse(doc.content) as Parameters<
					typeof resolveTemplateFields
				>[0]
				const resolvedEditorState = resolveTemplateFields(
					parsedEditorState,
					templateFieldMap,
				)
				const pdfBlob = await lexicalToPdf(
					JSON.stringify(resolvedEditorState),
					doc.title,
				)
				completeStep('GENERATE_PDF')

				// Step 2: Upload PDF
				beginStep('UPLOAD_PDF')
				pdfUrl = await uploadPdfToR2(pdfBlob, doc.title)
				completeStep('UPLOAD_PDF')

				// Step 3: Update application with PDF URL
				beginStep('UPDATE_APPLICATION')
				await updateApplication({
					id: application.id,
					data: { lease_agreement_document_url: pdfUrl },
				})
				completeStep('UPDATE_APPLICATION')
			}

			// Step 4: Approve
			beginStep('APPROVE')
			await approveApplication(application.id)
			completeStep('APPROVE')

			// Success
			setState({ status: 'SUCCESS' })
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.PROPERTY_TENANT_APPLICATIONS],
			})
			void revalidator.revalidate()

			setTimeout(() => {
				onSuccess()
			}, 2000)
		} catch (error) {
			if (progressIntervalRef.current) {
				clearInterval(progressIntervalRef.current)
				progressIntervalRef.current = null
			}

			let errorMessage = 'An unexpected error occurred'
			if (error instanceof Error) {
				errorMessage = error.message
			}

			setState((prev) => {
				const failedStep =
					prev.status === 'PROCESSING' ? prev.currentStep : 'APPROVE'
				return { status: 'ERROR', failedStep, error: errorMessage }
			})
		}
	}, [
		hasLeaseDocument,
		hasExistingPdfUrl,
		application,
		updateApplication,
		approveApplication,
		beginStep,
		completeStep,
		queryClient,
		revalidator,
		onSuccess,
	])

	const start = useCallback(() => {
		void runPipeline()
	}, [runPipeline])

	const retry = useCallback(() => {
		void runPipeline()
	}, [runPipeline])

	const reset = useCallback(() => {
		if (progressIntervalRef.current) {
			clearInterval(progressIntervalRef.current)
			progressIntervalRef.current = null
		}
		setState({ status: 'IDLE' })
	}, [])

	const description =
		state.status === 'PROCESSING'
			? STEP_DESCRIPTIONS[state.currentStep]
			: undefined

	const progress =
		state.status === 'PROCESSING'
			? state.progress
			: state.status === 'SUCCESS'
				? 100
				: 0

	return { state, start, retry, reset, description, progress }
}
