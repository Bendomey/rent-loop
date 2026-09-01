package services

import (
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

// A renewal's own chain must not count against it. A chain of three terms in
// one room must not have term two refuse term three.
func TestBlocksExcludingChainDropsChainMembers(t *testing.T) {
	mine, theirs := "lease-a", "lease-b"
	blocks := []models.UnitDateBlock{
		{LeaseID: &mine, StartDate: day(1), EndDate: day(10), SlotsOccupied: slot(1)},
		{LeaseID: &theirs, StartDate: day(1), EndDate: day(10), SlotsOccupied: slot(1)},
	}

	got := blocksExcludingChain(blocks, []string{mine})

	if len(got) != 1 {
		t.Fatalf("got %d blocks, want 1", len(got))
	}
	if got[0].LeaseID == nil || *got[0].LeaseID != theirs {
		t.Error("got the chain's own block kept, want it excluded")
	}
}

// A manual or booking block carries no lease id and can never be part of a
// chain. It must survive the filter.
func TestBlocksExcludingChainKeepsUnattachedBlocks(t *testing.T) {
	mine := "lease-a"
	blocks := []models.UnitDateBlock{{StartDate: day(1), EndDate: day(10)}}

	if got := blocksExcludingChain(blocks, []string{mine}); len(got) != 1 {
		t.Errorf("got %d blocks, want the maintenance block kept", len(got))
	}
}
