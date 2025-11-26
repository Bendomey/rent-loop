import { Image as ImageIcon, X } from 'lucide-react'
import {
	useEffect,
	useMemo,
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

type ImageFileTypes = `image/${string}`

type ExtendedFile = {
	file: File
	id: string
	imageSrc: string | undefined
}

type ImageUploadShape = 'circle' | 'square' | 'unset'

type ImageValidation = {
	fileTypes?: Array<ImageFileTypes>
	imageRatio?: `${number}/${number}`
	maxByteSize?: number
	maxHeight?: number
	maxWidth?: number
	minHeight?: number
	minWidth?: number
}

interface Props
	extends Omit<NativeInputProps, 'width' | 'height' | 'className'> {
	/** Allows ability to define which image types to allow to be uploaded. */
	acceptedFileTypes?: Array<ImageFileTypes>
	/** Sets the aspect ratio of the preview box (e.g., 16/9 for widescreen). When the uploaded image's aspect ratio differs by more than 20% from this value, it will display with a blurred background. */
	aspectRatio?: number
	/** The label for the button to change an uploaded image. */
	changeImageButtonLabel?: string
	/** The label for the button to choose an image to upload. */
	chooseImageButtonLabel?: string
	/** Allows user to pass classNames to customize block. */
	className?: string
	/** Allows the block to be disabled. */
	disabled?: boolean
	/** Callback function to be invoked when image is dismissed. */
	dismissCallback?: (src: string | undefined) => void
	/** Aria label for the dismiss image button. */
	dismissImageAriaLabel?: string
	/** Adds error message to the bottom of the component. */
	error?: string
	/** Callback function invoked when an image is uploaded. */
	fileCallback?:
		| ((file: File, image: HTMLImageElement) => Promise<void>)
		| ((file: File, image: HTMLImageElement) => void)
	/** Function to throw an error message when the image if larger than the maxByteSize allowed. */
	fileMaxKbSizeError?: (fileName: string, maxKbSize: number) => string
	/** Function to throw an error message when the image is larger than the maxHeight or maxWidth. */
	fileMaxSizeError?: (fileName: string) => string
	/** Function to throw an error message when the image is smaller than the minHeight or minWidth. */
	fileMinSizeError?: (fileName: string) => string
	/** Function to throw an error message when the image is not the right ratio. */
	fileRatioError?: (fileName: string) => string
	/** Boolean for hero image upload view. */
	hero?: boolean
	/** Hides the dismiss icon when an image is uploaded. */
	hideDismissIcon?: boolean
	/** Adds a hint message to the block. */
	hint?: string
	/** The height of the image preview. */
	imageHeight?: number
	/** Source of image to be rendered with the component. */
	imageSrc?: string
	/** The width of the image preview. */
	imageWidth?: number
	/** Class to apply to the input container. */
	inputContainerClassName?: string
	/** The label for the image upload block. */
	label?: string
	/** Adds name of the file input. */
	name?: string
	/** Function to run on input on onBlur. */
	onBlur?: FocusEventHandler<HTMLInputElement>
	/** Function that does any desired preProcessing of a file. */
	preProcessing?: (file: File) => Promise<File>
	/** Determines the shape of the displayed image. */
	shape?: ImageUploadShape
	/** Validations to do on the desired image before being uploaded. */
	validation?: ImageValidation
	/** Indicates whether the image is currently uploading. */
	isUploading?: boolean
}

interface ImageData {
	error: string
	file?: ExtendedFile
	status: 'idle' | 'pending' | 'resolved' | 'rejected'
}

interface ImageDimensions {
	height: number
	isLandscape: boolean
	width: number
}

interface ValidateImageDimensionsProps {
	file: File
	imageUrl: string
}

export function ImageUpload({
	acceptedFileTypes = ['image/*'],
	aspectRatio,
	changeImageButtonLabel = 'Change',
	chooseImageButtonLabel = 'Choose Image',
	className,
	disabled = false,
	dismissCallback,
	dismissImageAriaLabel = 'Remove Image',
	error = '',
	fileMaxKbSizeError = (fileName, maxKbSize) =>
		`${fileName} is too big to upload, the maximum size is ${maxKbSize}kb. Please try again.`,
	fileMaxSizeError = (fileName) =>
		`${fileName} is too large to upload. The maximum dimensions are ${validation?.maxWidth}x${validation?.maxHeight}. Please try again.`,
	fileMinSizeError = (fileName) =>
		`${fileName} is too small to upload. The minimum dimensions are ${validation?.minWidth}x${validation?.minHeight}. Please try again.`,
	fileRatioError = (fileName) =>
		`${fileName} must have a ratio of, ${validation?.imageRatio}. Please try again.`,
	fileCallback,
	hero = false,
	hideDismissIcon = false,
	hint,
	imageWidth = 160,
	imageSrc,
	inputContainerClassName,
	label = 'Upload Image',
	name = 'imageUpload',
	onBlur,
	preProcessing,
	shape = 'circle',
	validation,
	isUploading,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null)

	const [imageData, setImageData] = useState<ImageData>({
		error,
		status: imageSrc ? 'resolved' : 'idle',
	})
	const [imageDimensions, setImageDimensions] =
		useState<ImageDimensions | null>(null)

	const handleButtonClick = () =>
		inputRef?.current ? inputRef.current.click() : undefined

	useEffect(() => {
		if (imageSrc) {
			let isMounted = true
			setImageData((prevState) => ({ ...prevState, status: 'pending' }))

			const img = new Image()

			img.onload = () => {
				if (isMounted) {
					setImageDimensions({
						height: img.height,
						isLandscape: img.width >= img.height,
						width: img.width,
					})
					setImageData((prevState) => ({ ...prevState, status: 'resolved' }))
				}
			}

			img.onerror = () => {
				if (isMounted) {
					setImageData((prevState) => ({
						...prevState,
						status: 'rejected',
						error: 'Failed to load image',
					}))
				}
			}

			img.src = imageSrc

			return () => {
				isMounted = false
				img.onload = null
				img.onerror = null
				img.src = ''
			}
		} else {
			setImageData((prevState) => ({ ...prevState, status: 'idle' }))
			setImageDimensions(null)
		}
	}, [imageSrc])

	const imgSrc = useMemo(() => {
		if (imageData.file && imageData.status !== 'rejected') {
			setImageData((prevState) => ({ ...prevState, status: 'resolved' }))
			return imageData.file.imageSrc
		}

		if (imageSrc && imageData.status === 'resolved') {
			setImageData((prevState) => ({ ...prevState, status: 'resolved' }))
			return imageSrc
		}

		return null
	}, [imageData.file, imageData.status, imageSrc])

	const imageContent = useMemo(() => {
		const dismissImage = () => {
			if (dismissCallback) {
				dismissCallback(imageSrc)
			}
			setImageData((prevState) => ({
				...prevState,
				file: undefined,
				status: 'idle',
			}))
		}
		switch (imageData.status) {
			case 'resolved':
				// Determine if blur effect should be applied
				const shouldApplyBlur =
					aspectRatio &&
					imageDimensions &&
					(() => {
						const imageAspectRatio =
							imageDimensions.width / imageDimensions.height
						// Check if the image aspect ratio is significantly different from the desired ratio
						// Consider it mismatched if the ratios are inverted or differ by more than 20%
						const ratioThreshold = 0.2
						const ratioDifference =
							Math.abs(imageAspectRatio - aspectRatio) / aspectRatio
						return ratioDifference > ratioThreshold
					})()

				return (
					<>
						{shouldApplyBlur ? (
							// Image with blurred background when aspect ratios don't match
							<div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-sm">
								{/* Blurred background image */}
								<img
									alt={`${imageData.file?.id || 'image'} background`}
									className="absolute h-full w-full object-cover"
									src={imgSrc || undefined}
									style={{
										filter: 'blur(20px)',
										transform: 'scale(1.1)',
										zIndex: 1,
									}}
								/>
								{/* Sharp centered image on top */}
								<img
									alt={`${imageData.file?.id || 'image'} preview`}
									className="relative h-full object-contain"
									onLoad={() =>
										imageData?.file?.imageSrc
											? URL.revokeObjectURL(imageData.file.imageSrc)
											: undefined
									}
									src={imgSrc || undefined}
									style={{ zIndex: 2 }}
								/>
							</div>
						) : (
							// Default image rendering when aspect ratios match or no aspectRatio set
							<img
								alt={`${imageData.file?.id || 'image'} preview`}
								className={cn([
									'h-full w-full object-contain',
									shape === 'circle' ? 'rounded-full' : 'rounded-[4px]',
									aspectRatio ? 'rounded-sm object-cover' : '',
									(shape !== 'unset' && !aspectRatio) || !hero
										? 'aspect-square'
										: '',
									shape === 'unset' && hero ? 'aspect-video' : '',
									shape === 'unset' && !hero ? '!aspect-auto' : '',
								])}
								onLoad={() =>
									imageData?.file?.imageSrc
										? URL.revokeObjectURL(imageData.file.imageSrc)
										: undefined
								}
								src={imgSrc || undefined}
								width={imageWidth}
							/>
						)}
						{!disabled && !hideDismissIcon ? (
							<button
								type="button"
								aria-label={dismissImageAriaLabel}
								className="absolute -top-0.5 -right-0.5 z-10 rounded-[24px] bg-white !p-0 hover:!text-gray-500"
								data-testid="remove image"
								onClick={dismissImage}
							>
								<X className="p-0" />
							</button>
						) : null}
					</>
				)
			default:
				return (
					<ImageIcon
						className="size-8 text-gray-500"
						data-testid="placeholder image"
					/>
				)
		}
	}, [
		imageData,
		dismissCallback,
		imageSrc,
		shape,
		hero,
		imgSrc,
		imageWidth,
		disabled,
		hideDismissIcon,
		dismissImageAriaLabel,
		imageDimensions,
		aspectRatio,
	])

	const validateImageDimensions = ({
		file,
		imageUrl,
	}: ValidateImageDimensionsProps): Promise<boolean> => {
		return new Promise((resolve, reject) => {
			const img = new Image()

			const ratio = validation?.imageRatio?.split('/')

			img.onload = async () => {
				// Store image dimensions and orientation
				setImageDimensions({
					height: img.height,
					isLandscape: img.width >= img.height,
					width: img.width,
				})

				if (validation) {
					if (validation?.maxByteSize && file.size > validation.maxByteSize) {
						const error = fileMaxKbSizeError(
							file.name,
							Math.round(validation.maxByteSize / 1000),
						)
						setImageData({ error, file: undefined, status: 'rejected' })
						return reject(false)
					} else if (
						(validation?.minWidth && img.width < validation?.minWidth) ||
						(validation?.minHeight && img.height < validation?.minHeight)
					) {
						setImageData({
							error: fileMinSizeError(file.name),
							file: undefined,
							status: 'rejected',
						})
						return reject(false)
					} else if (
						(validation?.maxHeight && img.height > validation?.maxHeight) ||
						(validation?.maxWidth && img.width > validation?.maxWidth)
					) {
						setImageData({
							error: fileMaxSizeError(file.name),
							file: undefined,
							status: 'rejected',
						})
						return reject(false)
					} else if (
						validation?.imageRatio &&
						ratio?.length === 2 &&
						ratio[0] &&
						ratio[1] &&
						parseInt(ratio[0]) / parseInt(ratio[1]) !== img.width / img.height
					) {
						setImageData({
							error: fileRatioError(file.name),
							file: undefined,
							status: 'rejected',
						})
						return reject(false)
					}
				}
				if (typeof fileCallback === 'function') {
					await fileCallback(file, img)
				}
				setImageData((prevState) => ({ ...prevState, error: '' }))
				return resolve(true)
			}

			img.src = imageUrl

			img.onerror = () => {
				setImageData({
					error: 'Failed to load image',
					file: undefined,
					status: 'rejected',
				})
				return reject(false)
			}
		})
	}

	const handleOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
		try {
			const { files } = event.target
			if (files) {
				const file = files[0]
				if (file) {
					const imageUrl = URL.createObjectURL(file)
					try {
						let isImageValidated: boolean
						setImageData((prevState) => ({ ...prevState, status: 'pending' }))
						if (preProcessing) {
							await preProcessing(file)
						}
						isImageValidated = await validateImageDimensions({
							file,
							imageUrl,
						})
						if (isImageValidated) {
							setImageData((prevState) => ({
								...prevState,
								file: { file, id: file.name, imageSrc: imageUrl },
								status: 'resolved',
							}))
						}
					} catch {
						URL.revokeObjectURL(imageUrl)
					}
				}
			}
		} catch (error) {
			if (error instanceof Error) {
				throw error
			}
		}
	}

	const circleStyles = cn([
		shape === 'circle' && !hero ? 'aspect-square rounded-full' : '',
	])
	const squareStyles = cn([
		shape === 'square' && !hero ? 'aspect-square rounded-sm' : '',
	])
	const aspectRatioStyles = cn([aspectRatio && !hero ? 'rounded-[4px]' : ''])
	const unsetStyles = cn([
		shape === 'unset' && !hero ? 'rounded-1' : '',
		shape === 'unset' && imageData.status !== 'idle' && !hero
			? 'aspect-auto'
			: '',
		shape === 'unset' && imageData.status !== 'resolved' && !hero
			? 'aspect-square'
			: '',
	])
	const heroStyles = cn([hero ? 'aspect-video rounded-sm' : ''])

	const errorMessage = error || imageData.error
	const isLoading = imageData.status === 'pending' || isUploading

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

				<div className="relative flex flex-wrap justify-center gap-2 md:justify-start">
					<div
						className={cn([
							'mbe-2 md:mbe-0 md:mie-2 relative flex items-center justify-center',
							!hero && !aspectRatio ? 'w-4/5 md:w-1/2' : '',
							hero && !aspectRatio ? 'w-full' : '',
							disabled ? 'border-small border-tertiary-light border-solid' : '',
							imageData.status !== 'resolved' ? 'bg-gray-100' : '',
							circleStyles,
							squareStyles,
							aspectRatioStyles,
							unsetStyles,
							heroStyles,
						])}
						style={
							aspectRatio
								? { aspectRatio: String(aspectRatio), width: `${imageWidth}px` }
								: undefined
						}
					>
						{imageContent}
						{isLoading ? (
							<div
								role="status"
								aria-live="polite"
								aria-label="Loading"
								className="absolute z-20 flex h-full w-full items-center justify-center"
							>
								<Spinner className="size-20 text-rose-600" />
							</div>
						) : null}
					</div>
					<Button
						className={cn([
							'my-auto disabled:!border-none',
							hero ? '!mt-2' : '',
						])}
						disabled={disabled}
						onClick={handleButtonClick}
						size="sm"
						type="button"
						variant="outline"
					>
						{imageData.status === 'resolved'
							? changeImageButtonLabel
							: chooseImageButtonLabel}
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
