package lib

import "slices"

var SupportedCurrencies = []string{"GHS", "USD", "CAD", "EUR", "GBP", "NGN", "KES", "ZAR", "XOF", "XAF"}

// IsSupportedCurrency reports whether c is in the V1 supported currency list.
func IsSupportedCurrency(c string) bool {
	return slices.Contains(SupportedCurrencies, c)
}
