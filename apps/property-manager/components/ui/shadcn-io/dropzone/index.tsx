import { UploadIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { createContext, useContext, useState } from 'react'
import type { DropEvent, DropzoneOptions, FileRejection } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'
import { Button } from '~/components/ui/button'
import { TypographySmall } from '~/components/ui/typography'
import { cn } from '~/lib/utils'

type DropzoneContextType = {
	src?: File[]
	accept?: DropzoneOptions['accept']
	maxSize?: DropzoneOptions['maxSize']
	minSize?: DropzoneOptions['minSize']
	maxFiles?: DropzoneOptions['maxFiles']
	errorMessage?: string | null
}

const renderBytes = (bytes: number) => {
	const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
	let size = bytes
	let unitIndex = 0

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024
		unitIndex++
	}

	return `${size.toFixed(0)}${units[unitIndex]}`
}

const DropzoneContext = createContext<DropzoneContextType | undefined>(
	undefined,
)

export type DropzoneProps = Omit<DropzoneOptions, 'onDrop'> & {
	src?: File[]
	className?: string
	onDrop?: (
		acceptedFiles: File[],
		fileRejections: FileRejection[],
		event: DropEvent,
	) => void
	children?: ReactNode
	content?: ReactNode
	caption?: ReactNode
}

export const Dropzone = ({
	accept,
	maxFiles = 1,
	maxSize,
	minSize,
	onDrop,
	onError,
	disabled,
	src,
	className,
	children,
	caption,
	content,
	...props
}: DropzoneProps) => {
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		accept,
		maxFiles,
		maxSize,
		minSize,
		onError,
		disabled,
		multiple: maxFiles > 1,
		onDrop: (acceptedFiles, fileRejections, event) => {
			setErrorMessage(null)

			if (fileRejections.length > 0) {
				const error = fileRejections.at(0)?.errors.at(0)
				let errorMessage = error?.message || 'File upload error'

				if (error?.code === 'file-invalid-type') {
					errorMessage = 'Unsupported file type'
				}

				if (error?.code === 'file-too-large') {
					errorMessage = `File is too large. Max size is ${renderBytes(maxSize || 0)}`
				}

				if (error?.code === 'too-many-files') {
					errorMessage = `Too many files. Max number of files is ${maxFiles}`
				}

				setErrorMessage(errorMessage)
				onError?.(new Error(errorMessage))
				return
			}

			onDrop?.(acceptedFiles, fileRejections, event)
		},
		...props,
	})

	return (
		<DropzoneContext.Provider
			key={JSON.stringify(src)}
			value={{ src, accept, maxSize, minSize, maxFiles, errorMessage }}
		>
			<Button
				className={cn(
					'relative h-auto w-full flex-col overflow-hidden p-8',
					isDragActive && 'ring-ring ring-1 outline-none',
					errorMessage && 'ring-destructive ring-1',
					className,
				)}
				disabled={disabled}
				type="button"
				variant="outline"
				{...getRootProps()}
			>
				<input {...getInputProps()} disabled={disabled} />
				{content ?? children}
			</Button>
			{errorMessage ? (
				<TypographySmall className="text-destructive">
					{errorMessage}
				</TypographySmall>
			) : (
				caption
			)}
		</DropzoneContext.Provider>
	)
}

const useDropzoneContext = () => {
	const context = useContext(DropzoneContext)

	if (!context) {
		throw new Error('useDropzoneContext must be used within a Dropzone')
	}

	return context
}

export type DropzoneContentProps = {
	children?: ReactNode
	className?: string
}

const maxLabelItems = 3

export const DropzoneContent = ({
	children,
	className,
}: DropzoneContentProps) => {
	const { src } = useDropzoneContext()

	if (!src) {
		return null
	}

	if (children) {
		return children
	}

	return (
		<div className={cn('flex flex-col items-center justify-center', className)}>
			<div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-md">
				<UploadIcon size={16} />
			</div>
			<p className="my-2 w-full truncate text-sm font-medium">
				{src.length > maxLabelItems
					? `${new Intl.ListFormat('en').format(
							src.slice(0, maxLabelItems).map((file) => file.name),
						)} and ${src.length - maxLabelItems} more`
					: new Intl.ListFormat('en').format(src.map((file) => file.name))}
			</p>
			<p className="text-muted-foreground w-full text-xs text-wrap">
				Drag and drop or click to replace
			</p>
		</div>
	)
}

export type DropzoneEmptyStateProps = {
	children?: ReactNode
	className?: string
}

export const DropzoneEmptyState = ({
	children,
	className,
}: DropzoneEmptyStateProps) => {
	const { src, maxSize, minSize, maxFiles } = useDropzoneContext()

	if (src) {
		return null
	}

	if (children) {
		return children
	}

	let caption = ''

	if (minSize && maxSize) {
		caption += ` between ${renderBytes(minSize)} and ${renderBytes(maxSize)}`
	} else if (minSize) {
		caption += ` at least ${renderBytes(minSize)}`
	} else if (maxSize) {
		caption += ` less than ${renderBytes(maxSize)}`
	}

	return (
		<div className={cn('flex flex-col items-center justify-center', className)}>
			<div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-md">
				<UploadIcon size={16} />
			</div>
			<p className="my-2 w-full truncate text-sm font-medium text-wrap">
				Upload {maxFiles === 1 ? 'a file' : 'files'}
			</p>
			<p className="text-muted-foreground w-full truncate text-xs text-wrap">
				Drag and drop or click to upload
			</p>
			{caption && (
				<p className="text-muted-foreground text-xs text-wrap">{caption}.</p>
			)}
		</div>
	)
}
