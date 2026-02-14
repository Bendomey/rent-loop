import { FileText, X } from 'lucide-react'
import {
	useRef,
	useState,
	type AllHTMLAttributes,
	type ChangeEvent,
	type FocusEventHandler,
} from 'react'
import { Button } from './button'
import { Label } from './label'
import { Spinner } from './spinner'
import { TypographyMuted } from './typography'
import { cn } from '~/lib/utils'

type NativeInputProps = AllHTMLAttributes<HTMLInputElement>

type DocumentFileTypes =
	| 'application/pdf'
	| 'application/msword'
	| 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	| 'application/vnd.ms-excel'
	| 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	| 'text/plain'
	| 'text/csv'
	| (string & {})

type ExtendedFile = {
	file: File
	id: string
}

interface Props
	extends Omit<NativeInputProps, 'width' | 'height' | 'className'> {
	/** Allows ability to define which document types to allow to be uploaded. */
	acceptedFileTypes?: Array<DocumentFileTypes>
	/** The label for the button to change an uploaded document. */
	changeDocumentButtonLabel?: string
	/** The label for the button to choose a document to upload. */
	chooseDocumentButtonLabel?: string
	/** Allows user to pass classNames to customize block. */
	className?: string
	/** Allows the block to be disabled. */
	disabled?: boolean
	/** Callback function to be invoked when document is dismissed. */
	dismissCallback?: (fileName: string | undefined) => void
	/** Aria label for the dismiss document button. */
	dismissDocumentAriaLabel?: string
	/** Adds error message to the bottom of the component. */
	error?: string
	/** Callback function invoked when a document is uploaded. */
	fileCallback?: ((file: File) => Promise<void>) | ((file: File) => void)
	/** Function to throw an error message when the file is larger than the maxByteSize allowed. */
	fileMaxSizeError?: (fileName: string, maxKbSize: number) => string
	/** Hides the dismiss icon when a document is uploaded. */
	hideDismissIcon?: boolean
	/** Adds a hint message to the block. */
	hint?: string
	/** Class to apply to the input container. */
	inputContainerClassName?: string
	/** The label for the document upload block. */
	label?: string
	/** Maximum file size in bytes. */
	maxByteSize?: number
	/** Adds name of the file input. */
	name?: string
	/** Function to run on input on onBlur. */
	onBlur?: FocusEventHandler<HTMLInputElement>
	/** Function that does any desired preProcessing of a file. */
	preProcessing?: (file: File) => Promise<File>
	/** Name of an already uploaded document to display. */
	documentName?: string
	/** Indicates whether the document is currently uploading. */
	isUploading?: boolean
}

interface DocumentData {
	error: string
	file?: ExtendedFile
	status: 'idle' | 'pending' | 'resolved' | 'rejected'
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentUpload({
	acceptedFileTypes = ['application/pdf'],
	changeDocumentButtonLabel = 'Change',
	chooseDocumentButtonLabel = 'Choose Document',
	className,
	disabled = false,
	dismissCallback,
	dismissDocumentAriaLabel = 'Remove Document',
	error = '',
	fileCallback,
	fileMaxSizeError = (fileName, maxKbSize) =>
		`${fileName} is too big to upload, the maximum size is ${maxKbSize}kb. Please try again.`,
	hideDismissIcon = false,
	hint,
	inputContainerClassName,
	label = 'Upload Document',
	maxByteSize,
	name = 'documentUpload',
	onBlur,
	preProcessing,
	documentName,
	isUploading,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null)

	const [documentData, setDocumentData] = useState<DocumentData>({
		error,
		status: documentName ? 'resolved' : 'idle',
	})

	const handleButtonClick = () =>
		inputRef?.current ? inputRef.current.click() : undefined

	const displayName =
		documentData.file?.file.name || documentName || undefined
	const displaySize = documentData.file?.file.size
		? formatFileSize(documentData.file.file.size)
		: undefined

	const dismissDocument = () => {
		if (dismissCallback) {
			dismissCallback(displayName)
		}
		setDocumentData((prevState) => ({
			...prevState,
			file: undefined,
			status: 'idle',
		}))
	}

	const handleOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
		try {
			const { files } = event.target
			if (files) {
				const file = files[0]
				if (file) {
					setDocumentData((prevState) => ({
						...prevState,
						status: 'pending',
					}))

					if (preProcessing) {
						await preProcessing(file)
					}

					if (maxByteSize && file.size > maxByteSize) {
						const errorMsg = fileMaxSizeError(
							file.name,
							Math.round(maxByteSize / 1000),
						)
						setDocumentData({
							error: errorMsg,
							file: undefined,
							status: 'rejected',
						})
						return
					}

					if (typeof fileCallback === 'function') {
						await fileCallback(file)
					}

					setDocumentData({
						error: '',
						file: { file, id: file.name },
						status: 'resolved',
					})
				}
			}
		} catch (err) {
			if (err instanceof Error) {
				setDocumentData({
					error: err.message,
					file: undefined,
					status: 'rejected',
				})
			}
		}
	}

	const isResolved =
		documentData.status === 'resolved' && (documentData.file || documentName)
	const errorMessage = error || documentData.error
	const isLoading = documentData.status === 'pending' || isUploading

	return (
		<div className={cn([className])}>
			<div
				className={cn([
					'relative rounded-sm border border-solid p-4',
					inputContainerClassName,
					errorMessage ? 'border-red-400' : 'border-gray-200',
					disabled ? 'pointer-events-none bg-gray-50 select-none' : '',
				])}
			>
				<Label htmlFor={name} className="mb-5">
					{label}
				</Label>

				<div className="relative flex flex-wrap items-center justify-center gap-2 md:justify-start">
					<div
						className={cn([
							'relative flex items-center justify-center rounded-sm bg-gray-100',
							isResolved ? 'w-full gap-3 px-3 py-2 md:w-auto' : 'size-20',
						])}
					>
						{isLoading ? (
							<div
								role="status"
								aria-live="polite"
								aria-label="Loading"
								className="absolute z-20 flex h-full w-full items-center justify-center"
							>
								<Spinner className="size-8 text-rose-600" />
							</div>
						) : null}

						{isResolved ? (
							<>
								<FileText className="size-5 shrink-0 text-gray-500" />
								<div className="flex min-w-0 flex-1 flex-col">
									<span className="truncate text-sm font-medium">
										{displayName}
									</span>
									{displaySize ? (
										<span className="text-xs text-gray-500">{displaySize}</span>
									) : null}
								</div>
								{!disabled && !hideDismissIcon ? (
									<button
										type="button"
										aria-label={dismissDocumentAriaLabel}
										className="shrink-0 rounded-full p-0.5 hover:bg-gray-200"
										data-testid="remove document"
										onClick={dismissDocument}
									>
										<X className="size-4" />
									</button>
								) : null}
							</>
						) : (
							<FileText
								className="size-8 text-gray-500"
								data-testid="placeholder document"
							/>
						)}
					</div>

					<Button
						className="my-auto disabled:!border-none"
						disabled={disabled}
						onClick={handleButtonClick}
						size="sm"
						type="button"
						variant="outline"
					>
						{isResolved
							? changeDocumentButtonLabel
							: chooseDocumentButtonLabel}
					</Button>

					<input
						accept={acceptedFileTypes.toString()}
						className="hidden"
						disabled={disabled}
						id={name}
						name={name}
						onBlur={onBlur}
						onChange={handleOnChange}
						ref={inputRef}
						title=""
						type="file"
						value=""
					/>
				</div>
			</div>
			{errorMessage ? (
				<TypographyMuted className="mt-1 text-red-600">
					{errorMessage}
				</TypographyMuted>
			) : null}
			{hint ? <TypographyMuted className="mt-1">{hint}</TypographyMuted> : null}
		</div>
	)
}
