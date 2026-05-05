import type { DriveStep } from 'driver.js'

/**
 * Storage keys — bump the version suffix to reset a tour for all users.
 */
export const TOUR_KEYS = {
	DASHBOARD: 'rent-loop:tour-v1',
	PROPERTY_OVERVIEW: 'rent-loop:tour-property-overview-v1',
	TENANT_APPLICATION: 'rent-loop:tour-tenant-application-v1',
	MAINTENANCE_LIST: 'rent-loop:tour-maintenance-list-v1',
	MAINTENANCE_DETAIL: 'rent-loop:tour-maintenance-detail-v1',
	INVOICES: 'rent-loop:tour-invoices-v1',
	ANNOUNCEMENTS: 'rent-loop:tour-announcements-v1',
	LEASE_DETAIL: 'rent-loop:tour-lease-detail-v1',
} as const

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const DASHBOARD_TOUR_STEPS: DriveStep[] = [
	{
		popover: {
			title: 'Welcome to Rent-Loop! 🎉',
			description:
				"Let's take a quick tour of the main features to help you get started managing your rental properties.",
			side: 'over',
			align: 'center',
		},
	},
	{
		element: '#tour-nav-insights',
		popover: {
			title: 'Insights',
			description:
				'Your command center. Get a real-time overview of rent collection, occupancy rates, and recent activity across all your properties.',
			side: 'right',
			align: 'start',
		},
	},
	{
		element: '#tour-nav-properties',
		popover: {
			title: 'My Properties',
			description:
				'Manage all your rental properties here. Inside each property you can add blocks and units, review lease applications, manage leases, and track maintenance requests.',
			side: 'right',
			align: 'start',
		},
	},
	{
		element: '#tour-nav-settings',
		popover: {
			title: 'Settings & Billing',
			description:
				'Configure your account, invite team members, and connect payment accounts so you can start collecting rent online.',
			side: 'right',
			align: 'start',
		},
	},
]

// ─── Property Overview ───────────────────────────────────────────────────────

export const PROPERTY_OVERVIEW_TOUR_STEPS: DriveStep[] = [
	{
		element: '#property-overview-header',
		popover: {
			title: 'Property Overview',
			description:
				'This is your property dashboard. Everything about this property — performance, occupancy, and financials — is accessible from here.',
			side: 'bottom',
			align: 'start',
		},
	},
	{
		element: '#property-summary-cards',
		popover: {
			title: 'Key Metrics',
			description:
				'At-a-glance stats: occupancy rate, total revenue, active leases, and open maintenance requests with month-over-month comparisons.',
			side: 'bottom',
			align: 'start',
		},
	},
	{
		element: '#property-charts',
		popover: {
			title: 'Trends',
			description:
				'Visualise rental income trends over time and see how your units are distributed by status (available, occupied, maintenance).',
			side: 'top',
			align: 'start',
		},
	},
	{
		element: '#property-rent-income',
		popover: {
			title: 'Rent Income',
			description:
				'A breakdown of recent rent payments across your units — useful for spotting overdue payments quickly.',
			side: 'top',
			align: 'start',
		},
	},
]

// ─── Lease Application ──────────────────────────────────────────────────────

export const TENANT_APPLICATION_TOUR_STEPS: DriveStep[] = [
	{
		element: '#application-header',
		popover: {
			title: 'Application Overview',
			description:
				'Review the application code, current status, and submission details. The status badge updates as you progress through the steps.',
			side: 'bottom',
			align: 'start',
		},
	},
	{
		element: '#application-checklist',
		popover: {
			title: 'Completion Checklist',
			description:
				'Each section must be filled in before you can approve. Work through unit selection, tenant details, move-in setup, financials, and lease documents.',
			side: 'left',
			align: 'start',
		},
	},
	{
		element: '#application-actions',
		popover: {
			title: 'Approve or Cancel',
			description:
				'Once the checklist reaches 100%, the Approve button becomes active. You can also cancel the application here if needed.',
			side: 'left',
			align: 'start',
		},
	},
]

// ─── Maintenance Requests List ───────────────────────────────────────────────

export const MAINTENANCE_LIST_TOUR_STEPS: DriveStep[] = [
	{
		element: '#maintenance-list-header',
		popover: {
			title: 'Maintenance Requests',
			description:
				'Track and manage all maintenance requests for this property. Add new requests or let tenants submit them directly.',
			side: 'bottom',
			align: 'start',
		},
	},
	{
		element: '#maintenance-filters',
		popover: {
			title: 'Filters',
			description:
				'Narrow down requests by priority, category, assigned worker or manager, and unit.',
			side: 'bottom',
			align: 'start',
		},
	},
	{
		element: '#maintenance-kanban',
		popover: {
			title: 'Kanban Board',
			description:
				'Requests move through stages: New → In Progress → In Review → Resolved. Drag and drop cards to update their status.',
			side: 'top',
			align: 'start',
		},
	},
]

// ─── Maintenance Request Detail ──────────────────────────────────────────────

export const MAINTENANCE_DETAIL_TOUR_STEPS: DriveStep[] = [
	{
		element: '#request-title-area',
		popover: {
			title: 'Request Details',
			description:
				'The title and description are editable inline — click either one to make changes directly without opening a separate form.',
			side: 'bottom',
			align: 'start',
		},
	},
	{
		element: '#request-content-tabs',
		popover: {
			title: 'Activity Tabs',
			description:
				'Switch between History (status changes), Comments (team discussions), and Expenses (costs logged against this request).',
			side: 'top',
			align: 'start',
		},
	},
	{
		element: '#request-detail-sidebar',
		popover: {
			title: 'Request Sidebar',
			description:
				'Update status, set priority and category, and assign a worker or manager to this request — all from this panel.',
			side: 'left',
			align: 'start',
		},
	},
]

// ─── Invoices ────────────────────────────────────────────────────────────────

export const INVOICES_TOUR_STEPS: DriveStep[] = [
	{
		element: '#invoices-summary-cards',
		popover: {
			title: 'Payment Summary',
			description:
				'A snapshot of your property finances: total invoiced, amount paid, outstanding balance, and overdue payments.',
			side: 'bottom',
			align: 'start',
		},
	},
	{
		element: '#invoices-filters',
		popover: {
			title: 'Filters',
			description:
				'Search and filter invoices by status (Draft, Issued, Paid, Overdue), payer type, or payee type.',
			side: 'bottom',
			align: 'start',
		},
	},
	{
		element: '#invoices-table',
		popover: {
			title: 'Invoice Table',
			description:
				'Every invoice for this property — click the invoice code to open full payment details, history, and actions.',
			side: 'top',
			align: 'start',
		},
	},
]

// ─── Lease Detail ────────────────────────────────────────────────────────────

export const LEASE_DETAIL_TOUR_STEPS: DriveStep[] = [
	{
		popover: {
			title: 'Lease Overview',
			description:
				'This page gives you a full picture of a single lease — terms, tenant info, documents, and expenses all in one place.',
			side: 'over',
			align: 'center',
		},
	},
	{
		element: '#lease-sidebar',
		popover: {
			title: 'Lease Summary',
			description:
				'Key details at a glance: lease code, status, linked tenant and unit, rent fee, and quick-action buttons to start or terminate the lease.',
			side: 'right',
			align: 'start',
		},
	},
	{
		element: '#lease-tabs',
		popover: {
			title: 'Lease Tabs',
			description:
				'Navigate between Lease Details (terms & financials), Tenant Profile (personal & employment info), Documents (signed agreements), and Expenses logged against this lease.',
			side: 'bottom',
			align: 'start',
		},
	},
	{
		element: '#lease-checklist',
		popover: {
			title: 'Checklist',
			description:
				'Track the required steps to activate or close out this lease — inspection reports and other milestones appear here.',
			side: 'top',
			align: 'start',
		},
	},
]

// ─── Announcements ───────────────────────────────────────────────────────────

export const ANNOUNCEMENTS_TOUR_STEPS: DriveStep[] = [
	{
		element: '#announcements-header',
		popover: {
			title: 'Announcements',
			description:
				'Create and broadcast communications to all your tenants at once — great for maintenance notices, policy updates, or community news.',
			side: 'bottom',
			align: 'start',
		},
	},
	{
		element: '#announcements-table',
		popover: {
			title: 'Announcement List',
			description:
				'Track all your announcements by status: Draft (unpublished), Scheduled (future publish), Published (live), and Expired. Click a row to edit.',
			side: 'top',
			align: 'start',
		},
	},
]
