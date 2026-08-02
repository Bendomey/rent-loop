package services

import "github.com/Bendomey/rent-loop/services/main/pkg"

const (
	MaintenanceAssetTypeUnit  = "UNIT"
	MaintenanceAssetTypeBlock = "BLOCK"

	MaintenanceVisibilityTenantVisible = "TENANT_VISIBLE"
	MaintenanceVisibilityInternalOnly  = "INTERNAL_ONLY"
)

// MaintenanceAssetRef names one asset a maintenance request targets.
type MaintenanceAssetRef struct {
	Type string // UNIT | BLOCK
	ID   string
}

// PlannedMaintenanceRequest describes one request that should be created.
type PlannedMaintenanceRequest struct {
	Assets     []MaintenanceAssetRef
	Visibility string
}

// PlanMaintenanceRequests turns a landlord's asset selection into the set of
// requests to create, resolving each one's effective visibility.
//
// When fanOut is true, every selected asset becomes its own single-asset
// request. That is the path that keeps tenants informed, because each unit
// request is then narrow enough to stay tenant-visible.
func PlanMaintenanceRequests(
	unitIDs []string,
	blockIDs []string,
	requestedVisibility string,
	fanOut bool,
) ([]PlannedMaintenanceRequest, error) {
	assets := collectAssets(unitIDs, blockIDs)

	if len(assets) == 0 {
		return nil, pkg.BadRequestError("select at least one unit or block", nil)
	}

	if fanOut {
		planned := make([]PlannedMaintenanceRequest, 0, len(assets))
		for _, asset := range assets {
			single := []MaintenanceAssetRef{asset}
			planned = append(planned, PlannedMaintenanceRequest{
				Assets:     single,
				Visibility: resolveMaintenanceVisibility(single, requestedVisibility),
			})
		}
		return planned, nil
	}

	return []PlannedMaintenanceRequest{{
		Assets:     assets,
		Visibility: resolveMaintenanceVisibility(assets, requestedVisibility),
	}}, nil
}

// collectAssets flattens the two id lists into one ordered, deduplicated slice.
// A repeated id would otherwise violate the partial unique index on the assets
// table, or in fan-out mode create two identical requests.
func collectAssets(unitIDs, blockIDs []string) []MaintenanceAssetRef {
	assets := make([]MaintenanceAssetRef, 0, len(unitIDs)+len(blockIDs))
	seen := map[MaintenanceAssetRef]bool{}

	appendUnique := func(assetType string, ids []string) {
		for _, id := range ids {
			if id == "" {
				continue
			}
			ref := MaintenanceAssetRef{Type: assetType, ID: id}
			if seen[ref] {
				continue
			}
			seen[ref] = true
			assets = append(assets, ref)
		}
	}

	appendUnique(MaintenanceAssetTypeUnit, unitIDs)
	appendUnique(MaintenanceAssetTypeBlock, blockIDs)

	return assets
}

// resolveMaintenanceVisibility downgrades anything broader than a single unit to
// INTERNAL_ONLY. A single unit is the only shape with one lease to resolve and
// one tenant to notify. Downgrading silently mirrors the existing behaviour in
// CreateByAdmin when a unit has no active lease.
func resolveMaintenanceVisibility(assets []MaintenanceAssetRef, requested string) string {
	if len(assets) == 1 && assets[0].Type == MaintenanceAssetTypeUnit {
		return requested
	}
	return MaintenanceVisibilityInternalOnly
}
