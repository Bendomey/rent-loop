package services

import "testing"

// A single unit is the only shape with one lease to resolve and one tenant to
// notify, so it is the only shape allowed to stay tenant-visible.
func TestPlanKeepsTenantVisibleForSingleUnit(t *testing.T) {
	planned, err := PlanMaintenanceRequests([]string{"unit-1"}, nil, "TENANT_VISIBLE", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(planned) != 1 {
		t.Fatalf("got %d requests, want 1", len(planned))
	}
	if planned[0].Visibility != "TENANT_VISIBLE" {
		t.Errorf("got visibility %q, want TENANT_VISIBLE", planned[0].Visibility)
	}
	if len(planned[0].Assets) != 1 || planned[0].Assets[0].Type != "UNIT" {
		t.Errorf("got assets %+v, want a single UNIT asset", planned[0].Assets)
	}
}

func TestPlanForcesInternalForMultipleUnits(t *testing.T) {
	planned, err := PlanMaintenanceRequests([]string{"unit-1", "unit-2"}, nil, "TENANT_VISIBLE", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(planned) != 1 {
		t.Fatalf("got %d requests, want 1", len(planned))
	}
	if planned[0].Visibility != "INTERNAL_ONLY" {
		t.Errorf("got visibility %q, want INTERNAL_ONLY", planned[0].Visibility)
	}
}

// A block is common-area work with no lease behind it, so even one block on its
// own cannot be tenant-visible.
func TestPlanForcesInternalForSingleBlock(t *testing.T) {
	planned, err := PlanMaintenanceRequests(nil, []string{"block-1"}, "TENANT_VISIBLE", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if planned[0].Visibility != "INTERNAL_ONLY" {
		t.Errorf("got visibility %q, want INTERNAL_ONLY", planned[0].Visibility)
	}
}

func TestPlanForcesInternalWhenBlockAccompaniesSingleUnit(t *testing.T) {
	planned, err := PlanMaintenanceRequests([]string{"unit-1"}, []string{"block-1"}, "TENANT_VISIBLE", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if planned[0].Visibility != "INTERNAL_ONLY" {
		t.Errorf("got visibility %q, want INTERNAL_ONLY", planned[0].Visibility)
	}
	if len(planned[0].Assets) != 2 {
		t.Errorf("got %d assets, want 2", len(planned[0].Assets))
	}
}

// Fan-out is the path that keeps tenants informed: each unit becomes its own
// single-unit request and so may stay tenant-visible, while each block request
// is still internal.
func TestPlanFansOutOneRequestPerAsset(t *testing.T) {
	planned, err := PlanMaintenanceRequests(
		[]string{"unit-1", "unit-2"}, []string{"block-1"}, "TENANT_VISIBLE", true,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(planned) != 3 {
		t.Fatalf("got %d requests, want 3", len(planned))
	}
	for _, p := range planned {
		if len(p.Assets) != 1 {
			t.Fatalf("got %d assets on a fanned-out request, want 1", len(p.Assets))
		}
		want := "TENANT_VISIBLE"
		if p.Assets[0].Type == "BLOCK" {
			want = "INTERNAL_ONLY"
		}
		if p.Visibility != want {
			t.Errorf("asset %+v got visibility %q, want %q", p.Assets[0], p.Visibility, want)
		}
	}
}

func TestPlanHonoursExplicitInternalOnlyForSingleUnit(t *testing.T) {
	planned, err := PlanMaintenanceRequests([]string{"unit-1"}, nil, "INTERNAL_ONLY", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if planned[0].Visibility != "INTERNAL_ONLY" {
		t.Errorf("got visibility %q, want INTERNAL_ONLY", planned[0].Visibility)
	}
}

func TestPlanRejectsEmptySelection(t *testing.T) {
	if _, err := PlanMaintenanceRequests(nil, nil, "TENANT_VISIBLE", false); err == nil {
		t.Error("expected an error when no unit or block is selected")
	}
}

// A repeated id would otherwise violate the partial unique index, or in fan-out
// mode silently create two identical requests.
func TestPlanDeduplicatesRepeatedIDs(t *testing.T) {
	planned, err := PlanMaintenanceRequests([]string{"unit-1", "unit-1"}, nil, "TENANT_VISIBLE", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(planned[0].Assets) != 1 {
		t.Fatalf("got %d assets, want 1 after dedupe", len(planned[0].Assets))
	}
	// Deduped down to a single unit, so it is allowed to stay tenant-visible.
	if planned[0].Visibility != "TENANT_VISIBLE" {
		t.Errorf("got visibility %q, want TENANT_VISIBLE", planned[0].Visibility)
	}
}
