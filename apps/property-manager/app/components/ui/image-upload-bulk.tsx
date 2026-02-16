import { Image as ImageIcon, Plus, X } from 'lucide-react'
import {
	useRef,
	useState,
	type AllHTMLAttributes,
	type ChangeEvent,
	type FocusEventHandler,
} from 'react'
import { Label } from './label'
import { Spinner } from './spinner'
import { TypographyMuted } from './typography'
import { cn } from '~/lib/utils'

type NativeInputProps = AllHTMLAttributes<HTMLInputElement>

type ImageFileTypes = `image/${string}`

type ImageValidation = {
	fileTypes?: Array<ImageFileTypes>
	imageRatio?: `${number}/${number}`
	maxByteSize?: number
	maxHeight?: number
	maxWidth?: number
	minHeight?: number
	minWidth?: number
}

type UploadedImage = {
	id: string
	src: string
	file?: File
}

interface Props
	extends Omit<NativeInputProps, 'width' | 'height' | 'className'> {
	/** Allows ability to define which image types to allow to be uploaded. */
	acceptedFileTypes?: Array<ImageFileTypes>
	/** Allows user to pass classNames to customize block. */
	className?: string
	/** Allows the block to be disabled. */
	disabled?: boolean
	/** Adds error message to the bottom of the component. */
	error?: string
	/** Callback function invoked when an image is uploaded. */
	fileCallback?:
		| ((file: File, image: HTMLImageElement) => Promise<void>)
		| ((file: File, image: HTMLImageElement) => void)
	/** Function to throw an error message when the image is larger than the maxByteSize allowed. */
	fileMaxKbSizeError?: (fileName: string, maxKbSize: number) => string
	/** Function to throw an error message when the image is larger than the maxHeight or maxWidth. */
	fileMaxSizeError?: (fileName: string) => string
	/** Function to throw an error message when the image is smaller than the minHeight or minWidth. */
	fileMinSizeError?: (fileName: string) => string
	/** Function to throw an error message when the image is not the right ratio. */
	fileRatioError?: (fileName: string) => string
	/** Adds a hint message to the block. */
	hint?: string
	/** Existing image sources to pre-populate the grid. */
	imageSources?: Array<UploadedImage>
	/** Class to apply to the input container. */
	inputContainerClassName?: string
	/** The label for the image upload block. */
	label?: string
	/** Maximum number of images allowed. */
	maxImages?: number
	/** Adds name of the file input. */
	name?: string
	/** Function to run on input onBlur. */
	onBlur?: FocusEventHandler<HTMLInputElement>
	/** Callback when an image is removed. */
	onRemove?: (image: UploadedImage) => void
	/** Function that does any desired preProcessing of a file. */
	preProcessing?: (file: File) => Promise<File>
	/** Validations to do on the desired image before being uploaded. */
	validation?: ImageValidation
	/** IDs of images currently uploading. */
	uploadingIds?: Array<string>
}

export function ImageUploadBulk({
	acceptedFileTypes = ['image/*'],
	className,
	disabled = false,
	error = '',
	fileCallback,
	fileMaxKbSizeError = (fileName, maxKbSize) =>
		`${fileName} is too big to upload, the maximum size is ${maxKbSize}kb.`,
	fileMaxSizeError = (fileName) =>
		`${fileName} is too large to upload. The maximum dimensions are ${validation?.maxWidth}x${validation?.maxHeight}.`,
	fileMinSizeError = (fileName) =>
		`${fileName} is too small to upload. The minimum dimensions are ${validation?.minWidth}x${validation?.minHeight}.`,
	fileRatioError = (fileName) =>
		`${fileName} must have a ratio of ${validation?.imageRatio}.`,
	hint,
	imageSources = [],
	inputContainerClassName,
	label = 'Upload Images',
	maxImages,
	name = 'imageUploadBulk',
	onBlur,
	onRemove,
	preProcessing,
	validation,
	uploadingIds = [],
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [images, setImages] = useState<Array<UploadedImage>>(imageSources)
	const [errorMessage, setErrorMessage] = useState(error)
	const [processingCount, setProcessingCount] = useState(0)

	const canAddMore = !maxImages || images.length < maxImages

	const handleButtonClick = () => inputRef.current?.click()

	const validateImage = (
		file: File,
		imageUrl: string,
	): Promise<HTMLImageElement> => {
		return new Promise((resolve, reject) => {
			const img = new Image()
			const ratio = validation?.imageRatio?.split('/')

			img.onload = () => {
				if (validation) {
					if (validation.maxByteSize && file.size > validation.maxByteSize) {
						reject(
							fileMaxKbSizeError(
								file.name,
								Math.round(validation.maxByteSize / 1000),
							),
						)
						return
					}
					if (
						(validation.minWidth && img.width < validation.minWidth) ||
						(validation.minHeight && img.height < validation.minHeight)
					) {
						reject(fileMinSizeError(file.name))
						return
					}
					if (
						(validation.maxHeight && img.height > validation.maxHeight) ||
						(validation.maxWidth && img.width > validation.maxWidth)
					) {
						reject(fileMaxSizeError(file.name))
						return
					}
					if (
						validation.imageRatio &&
						ratio?.length === 2 &&
						ratio[0] &&
						ratio[1] &&
						parseInt(ratio[0]) / parseInt(ratio[1]) !== img.width / img.height
					) {
						reject(fileRatioError(file.name))
						return
					}
				}
				resolve(img)
			}

			img.onerror = () => reject('Failed to load image')
			img.src = imageUrl
		})
	}

	const handleOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const { files } = event.target
		if (!files || files.length === 0) return

		setErrorMessage('')
		const fileArray = Array.from(files)
		const remaining = maxImages ? maxImages - images.length : fileArray.length

		if (remaining <= 0) return

		const filesToProcess = fileArray.slice(0, remaining)
		setProcessingCount((prev) => prev + filesToProcess.length)

		for (const file of filesToProcess) {
			try {
				// Check for duplicate by file name and size
				const isDuplicate = images.some(
					(img) => img.file?.name === file.name && img.file?.size === file.size,
				)
				if (isDuplicate) {
					setErrorMessage(`${file.name} has already been selected.`)
					setProcessingCount((prev) => prev - 1)
					continue
				}

				const processedFile = preProcessing ? await preProcessing(file) : file
				const imageUrl = URL.createObjectURL(processedFile)

				try {
					const img = await validateImage(processedFile, imageUrl)

					if (fileCallback) {
						await fileCallback(processedFile, img)
					}

					const newImage: UploadedImage = {
						id: `${file.name}-${Date.now()}`,
						src: imageUrl,
						file: processedFile,
					}

					setImages((prev) => [...prev, newImage])
				} catch (validationError) {
					URL.revokeObjectURL(imageUrl)
					if (typeof validationError === 'string') {
						setErrorMessage(validationError)
					}
				}
			} catch (err) {
				if (err instanceof Error) {
					setErrorMessage(err.message)
				}
			} finally {
				setProcessingCount((prev) => prev - 1)
			}
		}

		// Reset input so re-selecting the same file triggers onChange
		if (inputRef.current) {
			inputRef.current.value = ''
		}
	}

	const handleRemove = (image: UploadedImage) => {
		if (image.file) {
			URL.revokeObjectURL(image.src)
		}
		setImages((prev) => prev.filter((img) => img.id !== image.id))
		onRemove?.(image)
	}

	const displayError = error || errorMessage
	const isProcessing = processingCount > 0

	return (
		<div className={cn(className)}>
			<div
				className={cn(
					'relative rounded-sm border border-solid p-4',
					inputContainerClassName,
					displayError ? 'border-red-400' : 'border-gray-200',
					disabled ? 'pointer-events-none bg-gray-50 select-none' : '',
				)}
			>
				<Label htmlFor={name} className="mb-3">
					{label}
				</Label>

				<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
					{images.map((image) => {
						const isUploading = uploadingIds.includes(image.id)
						return (
							<div
								key={image.id}
								className="group relative aspect-square overflow-hidden rounded-sm border border-gray-200 bg-gray-100"
							>
								<img
									alt={image.id}
									className="h-full w-full object-cover"
									src={image.src}
								/>
								{isUploading ? (
									<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
										<Spinner className="size-8 text-rose-600" />
									</div>
								) : null}
								{!disabled && !isUploading ? (
									<button
										type="button"
										aria-label={`Remove ${image.id}`}
										className="absolute top-1 right-1 z-10 rounded-full bg-white/90 p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-white"
										onClick={() => handleRemove(image)}
									>
										<X className="size-4 text-gray-600" />
									</button>
								) : null}
							</div>
						)
					})}

					{canAddMore && !disabled ? (
						<button
							type="button"
							className={cn(
								'flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100',
							)}
							onClick={handleButtonClick}
						>
							{isProcessing ? (
								<Spinner className="size-6 text-gray-400" />
							) : (
								<>
									<Plus className="size-6 text-gray-400" />
									<span className="text-xs text-gray-500">Add</span>
								</>
							)}
						</button>
					) : null}
				</div>

				{images.length === 0 && !canAddMore ? (
					<div className="flex flex-col items-center justify-center py-8 text-gray-400">
						<ImageIcon className="size-8" />
						<span className="mt-1 text-sm">No images</span>
					</div>
				) : null}

				<input
					accept={acceptedFileTypes.toString()}
					className="hidden"
					disabled={disabled}
					id={name}
					multiple
					name={name}
					onBlur={onBlur}
					onChange={handleOnChange}
					ref={inputRef}
					title=""
					type="file"
				/>
			</div>
			{displayError ? (
				<TypographyMuted className="mt-1 text-red-600">
					{displayError}
				</TypographyMuted>
			) : null}
			{hint ? <TypographyMuted className="mt-1">{hint}</TypographyMuted> : null}
		</div>
	)
}

export type { UploadedImage }
