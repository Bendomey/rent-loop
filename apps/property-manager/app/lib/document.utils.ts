type WitnessRole = 'pm_witness' | 'tenant_witness'

export interface WitnessNode {
	role: WitnessRole
	label: string
}

export function getWitnessNodesFromContent(
	content: string | null | undefined,
): WitnessNode[] {
	const nodes: WitnessNode[] = []
	if (!content) return nodes
	try {
		const state = JSON.parse(content) as Record<string, unknown>
		function walk(node: Record<string, unknown>) {
			if (node.type === 'signature') {
				const role = node.role as string
				if (role === 'pm_witness' || role === 'tenant_witness') {
					nodes.push({
						role,
						label:
							(node.label as string) ||
							(role === 'pm_witness'
								? 'Property Manager Witness'
								: 'Tenant Witness'),
					})
				}
			}
			if (Array.isArray(node.children)) {
				for (const child of node.children) {
					walk(child as Record<string, unknown>)
				}
			}
		}
		walk(state.root as Record<string, unknown>)
	} catch {
		// ignore parse errors
	}
	return nodes
}
