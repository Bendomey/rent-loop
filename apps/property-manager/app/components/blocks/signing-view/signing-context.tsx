import { createContext, useContext } from 'react'
import type { SignatureRole } from '~/components/editor/nodes/signature-node'

interface SigningContextValue {
	/** The role of the person currently signing */
	signerRole: SignatureRole
	/** The name of the person signing (displayed on the signature) */
	signerName: string
	/** Callback when a signature is confirmed — receives the dataURL from the canvas */
	onSign: (role: SignatureRole, signatureDataUrl: string) => void
	/** Whether a sign operation is in progress */
	isSigning: boolean
}

const Context = createContext<SigningContextValue | null>(null)

export function SigningProvider({
	signerRole,
	signerName,
	onSign,
	isSigning,
	children,
}: SigningContextValue & { children: React.ReactNode }) {
	return (
		<Context.Provider value={{ signerRole, signerName, onSign, isSigning }}>
			{children}
		</Context.Provider>
	)
}

/**
 * Returns the signing context if inside a SigningProvider, or null if in a regular editor.
 * Components should check for null to determine if they're in signing mode.
 */
export function useSigningContext(): SigningContextValue | null {
	return useContext(Context)
}
