package financials

import "testing"

// CLOSURE_ELIGIBLE passing is the case worth stating: an eligible account is
// still open, and a late charge on a tenancy that has just ended is ordinary.
// Refusing it would make the sweep's own grace period unusable.
func TestAssertAccountOpen(t *testing.T) {
	cases := []struct {
		status  string
		wantErr bool
	}{
		{StatusActive, false},
		{StatusClosureEligible, false},
		{StatusClosed, true},
	}

	for _, tc := range cases {
		t.Run(tc.status, func(t *testing.T) {
			err := AssertAccountOpen(tc.status)
			if tc.wantErr && err == nil {
				t.Fatalf("status %s should refuse a write", tc.status)
			}

			if !tc.wantErr && err != nil {
				t.Fatalf("status %s should allow a write, got %v", tc.status, err)
			}
		})
	}
}
