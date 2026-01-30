import { useRouteLoaderData } from 'react-router'
import {
	CreateNewPropertyTenantApplicationProvider,
	useTenantApplicationContext,
} from './context'
import { TenantApplicationOTPValidationModule } from './otp-validation'
import { TenantApplicationPhoneLookUpModule } from './phone-lookup'
import { TenantApplicationPreviewInfoModule } from './preview-info'
import type { loader } from '~/routes/tenants.apply'

const STEP = 5

export function TenantApply() {
	const parentData = useRouteLoaderData<typeof loader>('routes/tenants.apply')
	const { referredBy, unitId } = parentData || {
		referredBy: null,
		unitId: null,
	}

	const { stepCount } = useTenantApplicationContext()

	return (
		<div className="w-full">
			<div
				className="bg-rose-600"
				style={{ height: '3px', width: `${(stepCount / STEP) * 100}%` }}
			/>
			<div className="flex min-h-[88vh] items-center justify-center">
				<div className="w-full max-w-4xl px-4 md:px-0">
					{stepCount === 0 ? <TenantApplicationPhoneLookUpModule /> : null}
					{stepCount === 1 ? (
						<TenantApplicationOTPValidationModule
							referredBy={referredBy}
							unitId={unitId}
						/>
					) : null}
					{stepCount === 2 ? <TenantApplicationPreviewInfoModule /> : null}
				</div>
			</div>
		</div>
	)
}

export function TenantApplyModule() {
	return (
		<CreateNewPropertyTenantApplicationProvider>
			<TenantApply />
		</CreateNewPropertyTenantApplicationProvider>
	)
}
