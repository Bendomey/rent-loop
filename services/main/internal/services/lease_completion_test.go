package services

import "testing"

// The completion sweep selects Pending as well as Active leases — some
// managers never explicitly activate a lease before move-out — so the
// transition guard has to admit both. Rejecting Pending here is what left
// those leases failing every nightly run, never reaching a terminal state and
// never releasing their unit.
func TestIsCompletableStatus(t *testing.T) {
	cases := []struct {
		status string
		want   bool
	}{
		{"Lease.Status.Active", true},
		{"Lease.Status.Pending", true},
		{"Lease.Status.Completed", false},
		{"Lease.Status.Terminated", false},
		{"Lease.Status.Cancelled", false},
	}

	for _, tc := range cases {
		if got := isCompletableStatus(tc.status); got != tc.want {
			t.Errorf("isCompletableStatus(%q) = %v, want %v", tc.status, got, tc.want)
		}
	}
}
