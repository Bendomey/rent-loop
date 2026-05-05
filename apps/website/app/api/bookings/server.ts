import { fetchServer } from '~/lib/transport'

export async function getUnitForBookingPageServer(
	unitSlug: string,
	apiConfig: ApiConfigForServerConfig,
): Promise<PublicBookingUnit> {
	const response = await fetchServer<ApiResponse<PublicBookingUnit>>(
		`${apiConfig.baseUrl}/v1/units/${unitSlug}`,
		{ isUnAuthorizedRequest: true },
	)
	return response.parsedBody.data
}
