import { Plus, RotateCw, Search } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '~/components/ui/input-group'

export const UsersController = () => {
	return (
		<div className="flex w-full flex-col gap-2">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="text-primary-foreground flex items-center gap-2 text-sm subpixel-antialiased">
					<InputGroup>
						<InputGroupInput placeholder="Search users ..." />
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>
				</div>
				<div className="flex items-center justify-end gap-2">
					<Link to="/users/new">
						<Button
							variant="default"
							size="sm"
							className="bg-rose-600 text-white hover:bg-rose-700"
						>
							<Plus className="size-4" />
							Add User
						</Button>
					</Link>
					<Button variant="outline" size="sm">
						<RotateCw className="size-4" />
						Refresh
					</Button>
				</div>
			</div>
		</div>
	)
}
