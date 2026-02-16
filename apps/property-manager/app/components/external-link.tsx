import { Link, type LinkProps } from 'react-router'

interface ExternalLinkProps extends LinkProps {}

export function ExternalLink(props: ExternalLinkProps) {
	return <Link {...props} target="_blank" rel="noopener noreferrer" />
}
