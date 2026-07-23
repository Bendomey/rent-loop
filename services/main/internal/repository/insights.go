package repository

// PropertyAggregate is a single property's row in an insights risk breakdown:
// how much/many of something (outstanding rent, expiring leases, open
// maintenance requests) is attributable to that property. Value is pesewas
// for amount-based aggregates, a plain count otherwise.
type PropertyAggregate struct {
	PropertyID      string
	PropertyName    string
	PropertyAddress string
	Value           int64
}
