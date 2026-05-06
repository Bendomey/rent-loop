import { fetchServer } from '~/lib/transport'

export async function getUnitForBookingPageServer(
	propertySlug: string,
	unitSlug: string,
	apiConfig: ApiConfigForServerConfig,
): Promise<PropertyUnit> {
	const response = await fetchServer<ApiResponse<PropertyUnit>>(
		`${apiConfig.baseUrl}/v1/properties/${propertySlug}/units/${unitSlug}`,
		{ isUnAuthorizedRequest: true },
	)
	return response.parsedBody.data
}
