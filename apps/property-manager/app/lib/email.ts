export async function isDisposableEmailRemote(email: string): Promise<boolean> {
	try {
		const domain = email.split('@')[1]?.toLowerCase()
		if (!domain) return false
		const res = await fetch(`https://api.mailcheck.ai/domain/${domain}`)
		if (!res.ok) return false
		const data = (await res.json()) as { disposable?: boolean }
		return data.disposable === true
	} catch {
		// Fail open — don't block valid users if the API is down
		return false
	}
}
