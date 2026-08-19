package services

import (
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

// CreateLease declares ParentLeaseId in its input and, before this change,
// never assigned it to the model — so every renewal silently lost its lineage.
// This asserts the mapping directly, without a database.
func TestCreateLeaseInputCarriesParentLease(t *testing.T) {
	parent := "11111111-1111-1111-1111-111111111111"
	input := CreateLeaseInput{
		Status:        "Lease.Status.Pending",
		UnitId:        "22222222-2222-2222-2222-222222222222",
		TenantId:      "33333333-3333-3333-3333-333333333333",
		ParentLeaseId: &parent,
		Type:          models.LeaseTypeRenewal,
	}

	lease := leaseFromCreateInput(input)

	if lease.ParentLeaseId == nil {
		t.Fatal("got nil ParentLeaseId, want it carried from the input — this is the bug")
	}
	if *lease.ParentLeaseId != parent {
		t.Errorf("got parent %q, want %q", *lease.ParentLeaseId, parent)
	}
	if lease.Type != models.LeaseTypeRenewal {
		t.Errorf("got type %q, want RENEWAL", lease.Type)
	}
}

// An ordinary lease has no parent and is ORIGINAL. Type is defaulted rather
// than left empty, so the column is never blank on a row this code wrote.
func TestCreateLeaseInputDefaultsToOriginal(t *testing.T) {
	lease := leaseFromCreateInput(CreateLeaseInput{
		Status: "Lease.Status.Pending",
		UnitId: "22222222-2222-2222-2222-222222222222",
	})

	if lease.ParentLeaseId != nil {
		t.Errorf("got parent %v, want nil", lease.ParentLeaseId)
	}
	if lease.Type != models.LeaseTypeOriginal {
		t.Errorf("got type %q, want ORIGINAL", lease.Type)
	}
}
