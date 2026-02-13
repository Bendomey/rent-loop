import { useParams } from 'react-router'
import { DocumentUpload } from '~/components/ui/document-upload'
import { ImageUpload } from '~/components/ui/image-upload'
import { ImageUploadBulk } from '~/components/ui/image-upload-bulk'
import { useProperty } from '~/providers/property-provider'

export function PropertyTenantApplicationDocs() {
	const { applicationId } = useParams()
	const { clientUserProperty } = useProperty()

	return (
		<div>
			<p>Docs detail</p>


			<ImageUpload
				shape="circle"
				hint="Optional"
				acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
				// error={rhfMethods.formState.errors?.logo_url?.message}
				// fileCallback={upload}
				// isUploading={isUploading}
				dismissCallback={() => {
					// rhfMethods.setValue('logo_url', undefined, {
					// 	shouldDirty: true,
					// 	shouldValidate: true,
					// })
				}}
				// imageSrc={safeString(rhfMethods.watch('logo_url'))}
				label="Logo"
				name="logo"
				validation={{
					maxByteSize: 2048000, // 2MB
				}}
			/>

			<DocumentUpload
				acceptedFileTypes={['application/pdf']}
				label="Supporting Document"
				hint="Upload a PDF document (max 5MB)"
				name="supporting_document"
				maxByteSize={5242880}
				// fileCallback={async (file) => { /* handle upload */ }}
				// dismissCallback={() => { /* handle dismiss */ }}
				// documentName={existingDocName}
				// isUploading={isUploading}
				// error={rhfMethods.formState.errors?.document?.message}
			/>

			<ImageUploadBulk
				acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png']}
				label="Additional Photos"
				hint="Upload up to 10 images (max 2MB each)"
				name="additional_photos"
				maxImages={10}
				validation={{
					maxByteSize: 2048000, // 2MB
				}}
				// fileCallback={async (file, img) => { /* handle upload */ }}
				// onRemove={(image) => { /* handle removal */ }}
				// imageSources={existingImages}
				// uploadingIds={uploadingImageIds}
				// error={rhfMethods.formState.errors?.photos?.message}
			/>
		</div>
	)
}
