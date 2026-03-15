import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { sanitizeFilename } from '~/lib/strings'

type UploadState = {
	isLoading: boolean
	url?: string
	error?: string
}

export function useUploadObjectBulk(folder: string) {
	const [uploads, setUploads] = useState<Record<string, UploadState>>({})

	const upload = useCallback(
		async (id: string, file: File) => {
			setUploads((prev) => ({ ...prev, [id]: { isLoading: true } }))

			try {
				const formData = new FormData()
				formData.append('file', file)
				formData.append(
					'objectKey',
					`${folder}/${new Date().toISOString()}-${sanitizeFilename(file.name)}`,
				)

				const response = await fetch('/api/r2/upload', {
					method: 'POST',
					body: formData,
				})

				const data = (await response.json()) as { error?: string; url?: string }

				if (data.error) {
					toast.error('Failed to upload file.')
					setUploads((prev) => ({
						...prev,
						[id]: { isLoading: false, error: data.error },
					}))
				} else if (data.url) {
					setUploads((prev) => ({
						...prev,
						[id]: { isLoading: false, url: data.url },
					}))
				}
			} catch {
				toast.error('Failed to upload file.')
				setUploads((prev) => {
					const next = { ...prev }
					delete next[id]
					return next
				})
			}
		},
		[folder],
	)

	const remove = useCallback((id: string) => {
		setUploads((prev) => {
			const next = { ...prev }
			delete next[id]
			return next
		})
	}, [])

	const uploadingIds = useMemo(
		() =>
			Object.entries(uploads)
				.filter(([, state]) => state.isLoading)
				.map(([id]) => id),
		[uploads],
	)

	const uploadedUrls = useMemo(
		() =>
			Object.values(uploads)
				.filter((state) => Boolean(state.url))
				.map((state) => state.url!),
		[uploads],
	)

	return {
		upload,
		remove,
		uploadingIds,
		uploadedUrls,
		isUploading: uploadingIds.length > 0,
	}
}
