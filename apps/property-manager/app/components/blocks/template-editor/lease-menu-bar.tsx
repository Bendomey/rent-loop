import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, $nodesOfType } from 'lexical'
import {
	ArrowLeft,
	CheckCircle2,
	Circle,
	Eye,
	Lock,
	RotateCcw,
	Save,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAdminUpdateDocument } from '~/api/documents'
import { SignatureNode } from '~/components/editor/nodes/signature-node'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Separator } from '~/components/ui/separator'
import { TypographyMuted } from '~/components/ui/typography'

interface LeaseMenuBarProps {
	document: RentloopDocument
	tenantApplication: TenantApplication
	onFinalize?: () => void
	onRevertToDraft?: () => void
}

export function LeaseMenuBar({
	document,
	tenantApplication,
	onFinalize,
	onRevertToDraft,
}: LeaseMenuBarProps) {
	const navigate = useNavigate()
	const [editor] = useLexicalComposerContext()
	const updateDocument = useAdminUpdateDocument()
	const savedContentRef = useRef(document.content)
	const isFirstUpdateRef = useRef(true)
	const [hasChanges, setHasChanges] = useState(false)
	const [hasPmSignature, setHasPmSignature] = useState(false)
	const [hasTenantSignature, setHasTenantSignature] = useState(false)
	const [showFinalizeModal, setShowFinalizeModal] = useState(false)

	useEffect(() => {
		return editor.registerUpdateListener(({ editorState }) => {
			const currentContent = JSON.stringify(editorState.toJSON())

			if (isFirstUpdateRef.current) {
				// Lexical normalizes the state on hydration (field ordering, node IDs,
				// defaults), so re-baseline the ref to avoid a false hasChanges=true.
				savedContentRef.current = currentContent
				isFirstUpdateRef.current = false
			} else {
				setHasChanges(currentContent !== savedContentRef.current)
			}

			editorState.read(() => {
				const nodes = $nodesOfType(SignatureNode)
				setHasPmSignature(nodes.some((n) => n.getRole() === 'property_manager'))
				setHasTenantSignature(nodes.some((n) => n.getRole() === 'tenant'))
			})
		})
	}, [editor])

	const handleSaveDraft = () => {
		const editorState = editor.getEditorState()
		const content = JSON.stringify(editorState.toJSON())
		const charCount = editorState.read(() => $getRoot().getTextContent().length)

		updateDocument.mutate(
			{
				id: document.id,
				content,
				size: charCount,
			},
			{
				onSuccess: () => {
					savedContentRef.current = content
					setHasChanges(false)
					toast.success('Draft saved')
				},
				onError: (error) => {
					toast.error('Failed to save', {
						description: error.message,
					})
				},
			},
		)
	}

	const docStatus = tenantApplication.lease_agreement_document_status

	const applicantName = [
		tenantApplication.first_name,
		tenantApplication.last_name,
	]
		.filter(Boolean)
		.join(' ')

	const unitName = tenantApplication.desired_unit?.name

	const canFinalize = hasPmSignature && hasTenantSignature

	const checks = [
		{ label: 'Property Manager signature field added', met: hasPmSignature },
		{ label: 'Tenant signature field added', met: hasTenantSignature },
	]

	return (
		<>
			<Dialog open={showFinalizeModal} onOpenChange={setShowFinalizeModal}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Finalize for Signing</DialogTitle>
						<DialogDescription>
							The following conditions must be met before this document can be
							finalized.
						</DialogDescription>
					</DialogHeader>
					<ul className="flex flex-col gap-2">
						{checks.map((check) => (
							<li key={check.label} className="flex items-center gap-2 text-sm">
								{check.met ? (
									<CheckCircle2 className="size-4 shrink-0 text-teal-500" />
								) : (
									<Circle className="size-4 shrink-0 text-zinc-300" />
								)}
								<span className={check.met ? '' : 'text-muted-foreground'}>
									{check.label}
								</span>
							</li>
						))}
					</ul>
					<DialogFooter>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowFinalizeModal(false)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							className="bg-rose-600 hover:bg-rose-800"
							disabled={!canFinalize}
							onClick={() => {
								setShowFinalizeModal(false)
								onFinalize?.()
							}}
						>
							<Lock className="size-3" />
							Confirm & Finalize
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<div className="flex flex-col justify-between gap-2 border-b py-3 md:flex-row md:items-center md:px-3">
				<div className="flex items-center space-x-2">
					<Button onClick={() => navigate(-1)} size="sm" variant="ghost">
						<ArrowLeft />
					</Button>
					<Separator orientation="vertical" className="!h-5" />
					<div className="flex flex-col">
						<h1 className="text-sm font-medium">{document.title}</h1>
						<div className="flex items-center gap-1.5">
							<TypographyMuted className="text-xs">
								{applicantName}
							</TypographyMuted>
							{unitName && (
								<>
									<span className="text-xs text-zinc-300">/</span>
									<TypographyMuted className="text-xs">
										{unitName}
									</TypographyMuted>
								</>
							)}
							<Badge variant="outline" className="ml-1 px-1.5 py-0 text-[10px]">
								#{tenantApplication.code}
							</Badge>
						</div>
					</div>
				</div>

				<div className="flex items-center space-x-2">
					{docStatus === 'DRAFT' ? (
						hasChanges ? (
							<Button
								size="sm"
								variant="outline"
								className="text-xs"
								onClick={handleSaveDraft}
								disabled={updateDocument.isPending}
							>
								<Save className="size-3" />
								{updateDocument.isPending ? 'Saving...' : 'Save Draft'}
							</Button>
						) : (
							<Button
								size="sm"
								className="bg-rose-600 text-xs hover:bg-rose-800"
								onClick={() => setShowFinalizeModal(true)}
							>
								<Lock className="size-3" />
								Finalize for Signing
							</Button>
						)
					) : docStatus === 'FINALIZED' ? (
						<>
							<Badge
								variant="outline"
								className="gap-1 border-amber-300 bg-amber-50 px-2 py-1 text-[10px] text-amber-700"
							>
								<Lock className="size-3" />
								Read Only — document is finalized
							</Badge>
							<Button
								size="sm"
								variant="outline"
								className="text-xs"
								onClick={onRevertToDraft}
							>
								<RotateCcw className="size-3" />
								Back to Draft
							</Button>
						</>
					) : (
						<Badge
							variant="outline"
							className="gap-1 border-zinc-300 bg-zinc-50 px-2 py-1 text-[10px] text-zinc-500"
						>
							<Eye className="size-3" />
							View Only
						</Badge>
					)}
				</div>
			</div>
		</>
	)
}
