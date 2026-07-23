package services

import (
	"context"
	"fmt"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/repository"
)

// RiskType identifies which Insights risk-summary breakdown is being requested.
type RiskType string

const (
	RiskTypeOutstandingRent RiskType = "outstanding_rent"
	RiskTypeExpiringLeases  RiskType = "expiring_leases"
	RiskTypeMaintenance     RiskType = "maintenance"
)

// expiringLeaseWindow mirrors the frontend's Insights risk-summary window
// (see app/modules/insights/overview/risk-summary.tsx: today..+60 days).
const expiringLeaseWindowDays = 60

type InsightsService interface {
	// ListRiskProperties returns the per-property breakdown backing an
	// Insights risk-summary modal. propertyIDs narrows to an exact set
	// (cross-property mobile scope); clientID (used when propertyIDs is nil)
	// scopes to every property under the client.
	ListRiskProperties(
		ctx context.Context,
		riskType RiskType,
		propertyIDs *[]string,
		clientID *string,
	) ([]repository.PropertyAggregate, error)
}

type insightsService struct {
	invoiceRepo            repository.InvoiceRepository
	leaseRepo              repository.LeaseRepository
	maintenanceRequestRepo repository.MaintenanceRequestRepository
}

func NewInsightsService(
	invoiceRepo repository.InvoiceRepository,
	leaseRepo repository.LeaseRepository,
	maintenanceRequestRepo repository.MaintenanceRequestRepository,
) InsightsService {
	return &insightsService{
		invoiceRepo:            invoiceRepo,
		leaseRepo:              leaseRepo,
		maintenanceRequestRepo: maintenanceRequestRepo,
	}
}

func (s *insightsService) ListRiskProperties(
	ctx context.Context,
	riskType RiskType,
	propertyIDs *[]string,
	clientID *string,
) ([]repository.PropertyAggregate, error) {
	switch riskType {
	case RiskTypeOutstandingRent:
		return s.invoiceRepo.GroupOutstandingByProperty(ctx, propertyIDs, clientID)
	case RiskTypeExpiringLeases:
		now := time.Now()
		return s.leaseRepo.GroupExpiringByProperty(
			ctx,
			propertyIDs,
			clientID,
			now,
			now.AddDate(0, 0, expiringLeaseWindowDays),
		)
	case RiskTypeMaintenance:
		return s.maintenanceRequestRepo.GroupOpenByProperty(ctx, propertyIDs, clientID)
	default:
		return nil, fmt.Errorf("unsupported risk type: %q", riskType)
	}
}
