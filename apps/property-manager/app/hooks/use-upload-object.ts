import { useEffect, useState } from 'react'
import { useFetcher } from 'react-router'
import { toast } from 'sonner'
import { sanitizeFilename } from '~/lib/strings'

export function useUploadObject(folder: string) {
	const uploadFetcher = useFetcher<{ error: string; url: string }>()
	const [url, setUrl] = useState<string>()
	const [error, setError] = useState<string>()

	const isLoading = uploadFetcher.state !== 'idle'

	// where there is an error in the action data, show an error toast
	useEffect(() => {
		if (uploadFetcher?.data?.error) {
			toast.error('Failed to upload file.')
			setError(uploadFetcher?.data?.error)
		}
	}, [uploadFetcher?.data])

	// where it's successful, save the url
	useEffect(() => {
		if (uploadFetcher?.data?.url) {
			setUrl(uploadFetcher?.data?.url)
		}
	}, [uploadFetcher?.data])

	const upload = async (file: File) => {
		setUrl(undefined)
		setError(undefined)
		const formData = new FormData()
		formData.append('file', file)
		formData.append(
			'objectKey',
			`${folder}/${new Date().toISOString()}-${sanitizeFilename(file.name)}`,
		)

		await uploadFetcher.submit(formData, {
			action: '/api/r2/upload',
			method: 'POST',
			encType: 'multipart/form-data',
		})
	}

	return {
		upload,
		isLoading,
		error,
		objectUrl: url,
	}
}
