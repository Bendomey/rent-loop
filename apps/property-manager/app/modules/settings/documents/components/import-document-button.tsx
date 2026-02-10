import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useFetcher, useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
	Dropzone,
	DropzoneContent,
	DropzoneEmptyState,
} from '~/components/dropzone'
import { Image } from '~/components/Image'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '~/components/ui/dialog'
import { Spinner } from '~/components/ui/spinner'
import { TypographyMuted } from '~/components/ui/typography'
import { API_STATUS, type APIStatusType } from '~/lib/constants'
import { safeString } from '~/lib/strings'

interface Props {
	property?: Property
}

export function ImportDocumentButton({ property }: Props) {
	const [files, setFiles] = useState<File[] | undefined>()
	const [previewerStatus, setPreviewerStatus] = useState<APIStatusType>(
		API_STATUS.IDLE,
	)
	const [convertingStatus, setConvertingStatus] = useState<APIStatusType>(
		API_STATUS.IDLE,
	)
	const [navigatingStatus, setNavigatingStatus] = useState<APIStatusType>(
		API_STATUS.IDLE,
	)
	const thumbnailFetcher = useFetcher<{ error: string; data: string }>()
	const conversionfetcher = useFetcher<{ error: string; data: string }>()
	const navigate = useNavigate()

	// where there is an error in the action data, show an error toast
	useEffect(() => {
		if (thumbnailFetcher?.data?.error) {
			toast.error('Failed to fetch file')
		}
	}, [thumbnailFetcher?.data])

	// where there is an error in the action data, show an error toast
	useEffect(() => {
		if (conversionfetcher?.data?.error) {
			toast.error('File import failed, try again later.')
		}
	}, [conversionfetcher?.data])

	// where there is an error in the action data, show an error toast
	useEffect(() => {
		async function navigateToDocument(documentId: string) {
			setNavigatingStatus(API_STATUS.PENDING)
			try {
				if (property) {
					await navigate(
						`/properties/${property.slug}/settings/documents/${documentId}`,
					)
				} else {
					await navigate(`/settings/documents/${documentId}`)
				}

				setNavigatingStatus(API_STATUS.SUCCESS)
			} catch {
				setNavigatingStatus(API_STATUS.ERROR)
				toast.error('Failed to navigate to document')
			}
		}

		if (conversionfetcher?.data?.data) {
			toast.error('Document uploaded successfully')
			void navigateToDocument(conversionfetcher.data.data)
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [conversionfetcher?.data])

	const handleDrop = async (files: File[]) => {
		setFiles(files)
		const file = files[0]
		if (!file) return

		if (file.type === 'application/pdf') {
			try {
				setPreviewerStatus(API_STATUS.PENDING)

				const formData = new FormData()
				formData.append('file', file)

				await thumbnailFetcher.submit(formData, {
					action: '/api/files/pdf/to-thumbnail',
					method: 'POST',
					encType: 'multipart/form-data',
				})

				setPreviewerStatus(API_STATUS.SUCCESS)
			} catch {
				setPreviewerStatus(API_STATUS.ERROR)
				toast.error('Failed to fetch file')
			}
		}
	}

	const convertFile = async () => {
		const file = files?.at(0)
		if (!file) return

		try {
			setConvertingStatus(API_STATUS.PENDING)
			const formData = new FormData()
			formData.append('file', file)
			formData.append('property_id', safeString(property?.id))

			await conversionfetcher.submit(formData, {
				action:
					file.type === 'application/pdf'
						? '/api/files/pdf/to-lexical'
						: '/api/files/docx/to-lexical',
				method: 'POST',
				encType: 'multipart/form-data',
			})

			setConvertingStatus(API_STATUS.SUCCESS)
		} catch {
			setConvertingStatus(API_STATUS.ERROR)
			toast.error('File conversion failed')
		}
	}
	const selectedFile = files?.at(0)

	const isLoading =
		previewerStatus === API_STATUS.PENDING ||
		convertingStatus === API_STATUS.PENDING ||
		navigatingStatus === API_STATUS.PENDING
	const isError =
		previewerStatus === API_STATUS.ERROR ||
		convertingStatus === API_STATUS.ERROR

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm">
					<Download className="size-4" />
					Import
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Import Document</DialogTitle>
					<DialogDescription>
						Upload a document to import its content.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-1">
					<Dropzone
						accept={{
							'application/pdf': ['.pdf'],
							'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
								['.docx'],
						}}
						maxFiles={1}
						maxSize={1024 * 1024 * 10}
						onDrop={handleDrop}
						src={files}
						caption={
							<TypographyMuted>Supported Format: .pdf, .docx</TypographyMuted>
						}
						content={
							selectedFile &&
							selectedFile.type === 'application/pdf' &&
							thumbnailFetcher?.data?.data ? (
								<Image
									src={thumbnailFetcher.data.data}
									alt="file previewer"
									height={100}
									width={100}
								/>
							) : undefined
						}
					>
						<DropzoneEmptyState />
						<DropzoneContent />
					</Dropzone>
				</div>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline">Cancel</Button>
					</DialogClose>
					<Button onClick={convertFile} disabled={!files || isError}>
						Import
					</Button>
				</DialogFooter>
				{isLoading ? (
					<div className="absolute inset-0 flex h-full w-full items-center justify-center rounded-md bg-black/70">
						<Spinner className="size-10 text-white" />
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	)
}
