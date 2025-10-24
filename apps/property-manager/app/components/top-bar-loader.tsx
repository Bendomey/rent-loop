import NProgress from 'nprogress'
import { useEffect } from 'react'
import { useNavigation } from 'react-router'

export function TopbarLoader() {
	const navigation = useNavigation()

	useEffect(() => {
		// NProgress.configure({ showSpinner: false });
		if (navigation.state === 'loading' || navigation.state === 'submitting') {
			NProgress.start()
		} else {
			NProgress.done()
		}
	}, [navigation.state])

	return null
}
