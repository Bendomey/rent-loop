import { zodResolver } from '@hookform/resolvers/zod'
import {
	CheckCircle,
	ExternalLink,
	FileText,
	Link2,
	Pen,
	SkipForward,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useGetDocuments } from '~/api/documents'
import {
	useGetLeaseTermination,
	useUpdateLeaseTermination,
} from '~/api/lease-terminations'
import { useSigningTokens } from '~/api/signing'
import { SigningStatusRow } from '~/modules/properties/property/occupancy/applications/application/docs/signing-status-row'
import { PromptSignatureButton } from '~/modules/properties/property/occupancy/applications/application/docs/prompt-signature-button'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { Spinner } from '~/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { cn } from '~/lib/utils'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

const manualSchema = z.object({
	document_url: z.string().url('Enter a valid URL'),
})
type ManualFormValues = z.infer<typeof manualSchema>

interface Props {
	lease: Lease
	propertyId: string
	terminationId: string
	onBack: () => void
	onNext: () => void
}

export function StepDocument({
	lease,
	propertyId,
	terminationId,
	onBack,
	onNext,
}: Props) {
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)

	const { data: termination, isLoading: isLoadingTermination } =
		useGetLeaseTermination(clientId, propertyId, lease.id, terminationId)

	const { mutateAsync: updateTermination, isPending: isUpdating } =
		useUpdateLeaseTermination()

	const { data: documentsData, isLoading: isLoadingDocs } = useGetDocuments(
		clientId,
		{ filters: {}, pagination: { page: 1, per: 50 }, populate: [] },
	)

	const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState<'manual' | 'online'>('manual')

	const form = useForm<ManualFormValues>({
		resolver: zodResolver(manualSchema),
		defaultValues: { document_url: '' },
	})

	useEffect(() => {
		if (!termination) return
		if (termination.document_mode === 'MANUAL' && termination.document_url) {
			setActiveTab('manual')
			form.setValue('document_url', termination.document_url)
		} else if (
			termination.document_mode === 'ONLINE' &&
			termination.document_id
		) {
			setActiveTab('online')
			setSelectedDocId(termination.document_id)
		}
	}, [termination, form])

	const { data: signingTokens, isPending: isLoadingTokens } = useSigningTokens(
		clientId,
		propertyId,
		{ filters: { document_id: termination?.document_id ?? undefined } },
	)
	const tenantToken =
		signingTokens?.rows?.find((t) => t.role === 'TENANT') ?? null

	const documents = documentsData?.rows ?? []
	const selectedDoc =
		documents.find((d) => d.id === selectedDocId) ??
		termination?.document ??
		null

	// PM signing is done via direct signing (not a token) — not tracked here
	const pmSigned = false

	const handleSaveManual = async (values: ManualFormValues) => {
		try {
			await updateTermination({
				client_id: clientId,
				property_id: propertyId,
				lease_id: lease.id,
				termination_id: terminationId,
				document_mode: 'MANUAL',
				document_url: values.document_url,
				document_id: null,
			})
			toast.success('Document URL saved')
			onNext()
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to save document',
			)
		}
	}

	const handleLinkOnline = async () => {
		if (!selectedDocId) return
		try {
			await updateTermination({
				client_id: clientId,
				property_id: propertyId,
				lease_id: lease.id,
				termination_id: terminationId,
				document_mode: 'ONLINE',
				document_id: selectedDocId,
				document_url: null,
			})
			toast.success('Document linked')
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to link document',
			)
		}
	}

	if (isLoadingTermination) {
		return (
			<div className="space-y-4 p-8">
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-40 w-full" />
			</div>
		)
	}

	const isOnlineSaved =
		termination?.document_mode === 'ONLINE' && termination.document_id
	const isManualSaved =
		termination?.document_mode === 'MANUAL' && termination.document_url

	return (
		<div className="flex flex-col gap-8 p-8">
			<div>
				<h2 className="text-base font-semibold">Termination Agreement</h2>
				<p className="text-muted-foreground mt-1 text-sm">
					Optional. Attach a signed termination agreement. You can link an
					external document or pick one from your library.
				</p>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as 'manual' | 'online')}
			>
				<TabsList className="w-full">
					<TabsTrigger value="manual" className="flex-1">
						<Link2 className="mr-1.5 size-3.5" />
						External URL
					</TabsTrigger>
					<TabsTrigger value="online" className="flex-1">
						<FileText className="mr-1.5 size-3.5" />
						From Library
					</TabsTrigger>
				</TabsList>

				{/* Manual URL mode */}
				<TabsContent value="manual" className="mt-6">
					{isManualSaved ? (
						<div className="space-y-4">
							<div className="flex items-center justify-between rounded-xl border p-4">
								<div className="flex items-center gap-3">
									<div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
										<FileText className="text-muted-foreground size-5" />
									</div>
									<div>
										<p className="text-sm font-medium">External Document</p>
										<a
											href={termination?.document_url ?? '#'}
											target="_blank"
											rel="noopener noreferrer"
											className="mt-0.5 flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
										>
											<ExternalLink className="size-3" />
											View Document
										</a>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
									>
										<CheckCircle className="mr-1 size-3" />
										Saved
									</Badge>
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											updateTermination({
												client_id: clientId,
												property_id: propertyId,
												lease_id: lease.id,
												termination_id: terminationId,
												document_mode: null,
												document_url: null,
											}).catch(() => toast.error('Failed to clear document'))
										}
									>
										Change
									</Button>
								</div>
							</div>
							<p className="text-muted-foreground text-xs">
								Manually uploaded documents are assumed to be pre-signed.
							</p>
						</div>
					) : (
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(handleSaveManual)}
								className="space-y-4"
							>
								<FormField
									control={form.control}
									name="document_url"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Document URL</FormLabel>
											<FormControl>
												<Input
													{...field}
													placeholder="https://example.com/termination-agreement.pdf"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="flex justify-end">
									<Button type="submit" disabled={isUpdating}>
										{isUpdating ? <Spinner /> : null}
										Save URL &amp; Continue
									</Button>
								</div>
							</form>
						</Form>
					)}
				</TabsContent>

				{/* Online document mode */}
				<TabsContent value="online" className="mt-6 space-y-6">
					{isOnlineSaved && selectedDoc ? (
						<div className="space-y-6">
							<div className="flex items-center justify-between rounded-xl border p-4">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
										<FileText className="size-5 text-blue-600 dark:text-blue-400" />
									</div>
									<div>
										<p className="text-sm font-medium">{selectedDoc.title}</p>
										<p className="text-muted-foreground mt-0.5 text-xs">
											From library
										</p>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										updateTermination({
											client_id: clientId,
											property_id: propertyId,
											lease_id: lease.id,
											termination_id: terminationId,
											document_mode: null,
											document_id: null,
										})
											.then(() => setSelectedDocId(null))
											.catch(() => toast.error('Failed to clear document'))
									}
								>
									Change
								</Button>
							</div>

							<div>
								<p className="mb-3 text-sm font-medium">Signing Status</p>
								<Separator className="mb-4" />
								{isLoadingTokens ? (
									<div className="space-y-3">
										<Skeleton className="h-10 w-full" />
										<Skeleton className="h-10 w-full" />
									</div>
								) : (
									<div className="space-y-3">
										<SigningStatusRow
											label="Property Manager"
											signed={pmSigned}
											signedAt={null}
											signedBy={undefined}
										/>
										{!pmSigned && (
											<Button size="sm" asChild>
												<Link
													to={`/properties/${propertyId}/occupancy/applications/${lease.tenant_application_id}/signing/${termination?.document_id}`}
													target="_blank"
												>
													<Pen className="size-4" />
													Sign Document
												</Link>
											</Button>
										)}
										<Separator />
										<SigningStatusRow
											label="Tenant"
											signed={Boolean(tenantToken)}
											signedAt={null}
											signedBy={undefined}
										/>
										<PromptSignatureButton
											existingToken={tenantToken}
											documentId={safeString(termination?.document_id)}
											role="TENANT"
											propertyId={propertyId}
										/>
									</div>
								)}
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<p className="text-muted-foreground text-sm">
								Select a document from your library to attach to this
								termination.
							</p>
							{isLoadingDocs ? (
								<div className="space-y-2">
									{Array.from({ length: 3 }).map((_, i) => (
										<Skeleton key={i} className="h-14 w-full" />
									))}
								</div>
							) : documents.length === 0 ? (
								<div className="rounded-xl border border-dashed py-10 text-center">
									<FileText className="text-muted-foreground mx-auto mb-2 size-8" />
									<p className="text-muted-foreground text-sm">
										No documents found. Create one in the Documents section.
									</p>
								</div>
							) : (
								<div className="flex flex-col gap-2">
									{documents.map((doc) => (
										<button
											key={doc.id}
											type="button"
											onClick={() => setSelectedDocId(doc.id)}
											className={cn(
												'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
												selectedDocId === doc.id
													? 'border-primary bg-primary/5 dark:bg-primary/10'
													: 'hover:bg-muted/40',
											)}
										>
											<div
												className={cn(
													'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
													selectedDocId === doc.id
														? 'bg-primary/10 text-primary'
														: 'bg-muted text-muted-foreground',
												)}
											>
												<FileText className="size-4" />
											</div>
											<p className="truncate text-sm font-medium">
												{doc.title}
											</p>
										</button>
									))}
								</div>
							)}
							{selectedDocId && (
								<div className="flex justify-end">
									<Button onClick={handleLinkOnline} disabled={isUpdating}>
										{isUpdating ? <Spinner /> : null}
										Link Document
									</Button>
								</div>
							)}
						</div>
					)}
				</TabsContent>
			</Tabs>

			<div className="flex items-center justify-between border-t pt-4">
				<Button variant="outline" onClick={onBack}>
					Back
				</Button>
				<div className="flex gap-2">
					<Button variant="ghost" onClick={onNext}>
						<SkipForward className="size-4" />
						Skip
					</Button>
					{(isManualSaved || isOnlineSaved) && (
						<Button onClick={onNext}>Continue</Button>
					)}
				</div>
			</div>
		</div>
	)
}
