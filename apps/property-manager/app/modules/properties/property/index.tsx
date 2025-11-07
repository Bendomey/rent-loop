// 🏠 1. Property Summary (Header Section)

import { useProperty } from '~/providers/property-provider'

// Show key identifiers at the top.

// Example:

// Property name — “Sunset Apartments”

// Address / Location — 21 Ridge Street, East Legon

// Type — Apartment Complex / Mixed-use / Office Building

// Total Units — 80 Units

// Occupancy Rate — 92%

// Property Manager — Jane Doe

// Status — Active / Under Maintenance / Upcoming

// Last Inspection Date

// Next Rent Cycle Date

// 💰 2. Financial Overview
// Key Stats

// Total Rent Income (This Month)

// Rent Collected (%)

// Outstanding Rent / Arrears

// Expenses (This Month)

// Maintenance

// Utilities

// Staff / Management fees

// Net Revenue (Income - Expenses)

// Average Rent per Unit

// Visuals

// 💵 Bar chart: Rent income vs Expenses (month-to-month)

// 📈 Line chart: Revenue trend (last 6 months)

// 🧍‍♂️ 3. Tenancy & Occupancy
// Key Stats

// Total Units: 80

// Occupied Units: 74

// Vacant Units: 6

// Pending Applications: 3

// Average Stay Duration: 14 months

// Upcoming Lease Expirations: 5 this month

// Visuals

// 🟢 Donut chart: Occupancy vs Vacant %

// 📅 List: Upcoming move-ins / move-outs

// 🧰 4. Maintenance & Facilities
// Key Stats

// Open Maintenance Requests: 4

// Resolved Requests (this month): 15

// Avg. Resolution Time: 2.4 days

// Facility Condition Rating: 8.6 / 10

// Scheduled Inspections: 2 upcoming

// Visuals

// 🧾 Bar or Timeline chart: Maintenance requests by category (Plumbing, Electrical, etc.)

// 🏊 5. Amenities Usage (optional if tracked)
// Key Stats

// Gym Usage (weekly)

// Pool Bookings (monthly)

// Parking Spots Occupied

// Event Hall Bookings

// Visuals

// Usage trends / activity logs

// 🧑‍💼 6. Management & Staff
// Key Info

// Assigned Managers / Staff

// Name, Role, Contact

// Tasks in Progress

// Response Rate / SLA compliance

export function PropertyModule() {
	const { property } = useProperty()
	return <div>Property overview {property?.name}</div>
}
