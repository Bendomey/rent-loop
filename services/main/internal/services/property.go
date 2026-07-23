package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type PropertyService interface {
	CreateProperty(context context.Context, input CreatePropertyInput) (*models.Property, error)
	ListProperties(
		context context.Context,
		filterQuery repository.ListPropertiesFilter,
	) ([]models.Property, error)
	CountProperties(
		context context.Context,
		filterQuery repository.ListPropertiesFilter,
	) (int64, error)
	GetProperty(
		context context.Context,
		query repository.GetPropertyQuery,
	) (*models.Property, error)
	UpdateProperty(context context.Context, input UpdatePropertyInput) (*models.Property, error)
	DeleteProperty(context context.Context, input DeletePropertyInput) error
	GetPropertyDeletionEligibility(
		context context.Context,
		input GetPropertyDeletionEligibilityInput,
	) (*PropertyDeletionEligibility, error)
	GetPropertyBySlug(
		context context.Context,
		query repository.GetPropertyBySlugQuery,
	) (*models.Property, error)
	GetPropertyRestorePreview(
		context context.Context,
		input GetPropertyRestorePreviewInput,
	) (*PropertyRestorePreview, error)
	RestoreProperty(context context.Context, input RestorePropertyInput) error
}

type propertyService struct {
	appCtx                    pkg.AppContext
	repo                      repository.PropertyRepository
	clientService             ClientService
	clientUserService         ClientUserService
	clientUserPropertyService ClientUserPropertyService
	unitService               UnitService
	propertyBlockService      PropertyBlockService
	leaseRepo                 repository.LeaseRepository
	bookingRepo               repository.BookingRepository
	tenantApplicationRepo     repository.TenantApplicationRepository
}

type PropertyServiceDependencies struct {
	AppCtx                    pkg.AppContext
	Repo                      repository.PropertyRepository
	ClientService             ClientService
	ClientUserService         ClientUserService
	ClientUserPropertyService ClientUserPropertyService
	UnitService               UnitService
	PropertyBlockService      PropertyBlockService
	LeaseRepo                 repository.LeaseRepository
	BookingRepo               repository.BookingRepository
	TenantApplicationRepo     repository.TenantApplicationRepository
}

func NewPropertyService(deps PropertyServiceDependencies) PropertyService {
	return &propertyService{
		appCtx:                    deps.AppCtx,
		repo:                      deps.Repo,
		clientService:             deps.ClientService,
		clientUserService:         deps.ClientUserService,
		clientUserPropertyService: deps.ClientUserPropertyService,
		unitService:               deps.UnitService,
		propertyBlockService:      deps.PropertyBlockService,
		leaseRepo:                 deps.LeaseRepo,
		bookingRepo:               deps.BookingRepo,
		tenantApplicationRepo:     deps.TenantApplicationRepo,
	}
}

type CreatePropertyInput struct {
	Type        string
	Status      string
	Name        string
	Description *string
	Images      []string
	Tags        []string
	Modes       []string
	Latitude    float64
	Longitude   float64
	Address     string
	Country     string
	Region      string
	City        string
	GPSAddress  *string
	ClientID    string
	CreatedByID string
	Currency    *string // if nil, defaults to Client.Currency
}

func (s *propertyService) CreateProperty(
	ctx context.Context,
	input CreatePropertyInput,
) (*models.Property, error) {
	var images pq.StringArray
	if input.Images != nil {
		images = pq.StringArray(input.Images)
	} else {
		images = pq.StringArray{}
	}

	var tags pq.StringArray
	if input.Tags != nil {
		tags = pq.StringArray(input.Tags)
	} else {
		tags = pq.StringArray{}
	}

	var modes pq.StringArray
	if input.Modes != nil {
		modes = pq.StringArray(input.Modes)
	} else {
		modes = pq.StringArray{}
	}

	currency := "GHS"
	if input.Currency != nil && *input.Currency != "" {
		if !lib.IsSupportedCurrency(*input.Currency) {
			return nil, pkg.BadRequestError("UnsupportedCurrency", nil)
		}
		currency = *input.Currency
	} else {
		client, clientErr := s.clientService.GetClient(ctx, input.ClientID)
		if clientErr == nil && client.Currency != "" {
			currency = client.Currency
		}
	}

	property := models.Property{
		Type:        input.Type,
		Status:      input.Status,
		Name:        input.Name,
		Description: input.Description,
		Images:      images,
		Tags:        tags,
		Modes:       modes,
		Latitude:    input.Latitude,
		Longitude:   input.Longitude,
		Address:     input.Address,
		Country:     input.Country,
		Region:      input.Region,
		City:        input.City,
		GPSAddress:  input.GPSAddress,
		ClientID:    input.ClientID,
		CreatedByID: input.CreatedByID,
		Currency:    currency,
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	if err := s.repo.Create(transCtx, &property); err != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CreateProperty",
				"action":   "creating new property",
			},
		})
	}

	clientUserOwner, clientUserErr := s.clientUserService.GetClientUserByQuery(
		ctx,
		map[string]any{"client_id": input.ClientID, "role": "OWNER"},
	)
	if clientUserErr != nil {
		transaction.Rollback()
		return nil, clientUserErr
	}

	ownerClientUserProperty := CreateClientUserPropertyInput{
		PropertyID:   property.ID.String(),
		ClientUserID: clientUserOwner.ID.String(),
		Role:         "MANAGER",
		CreatedByID:  &input.CreatedByID,
	}

	_, linkPropertyErr := s.clientUserPropertyService.LinkClientUserProperty(
		transCtx,
		ownerClientUserProperty,
	)
	if linkPropertyErr != nil {
		transaction.Rollback()
		return nil, linkPropertyErr
	}

	if clientUserOwner.ID.String() != input.CreatedByID {
		creatorClientUserProperty := CreateClientUserPropertyInput{
			PropertyID:   property.ID.String(),
			ClientUserID: input.CreatedByID,
			Role:         "MANAGER",
			CreatedByID:  &input.CreatedByID,
		}

		_, linkPropertyErr := s.clientUserPropertyService.LinkClientUserProperty(
			transCtx,
			creatorClientUserProperty,
		)
		if linkPropertyErr != nil {
			transaction.Rollback()
			return nil, linkPropertyErr
		}
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err: commitErr,
			Metadata: map[string]string{
				"function": "CreateProperty",
				"action":   "committing transaction",
			},
		})
	}
	return &property, nil
}

func (s *propertyService) ListProperties(
	ctx context.Context,
	filterQuery repository.ListPropertiesFilter,
) ([]models.Property, error) {
	properties, err := s.repo.List(ctx, filterQuery)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "ListProperties",
				"action":   "listing properties",
			},
		})
	}

	return *properties, nil
}

func (s *propertyService) CountProperties(
	ctx context.Context,
	filterQuery repository.ListPropertiesFilter,
) (int64, error) {
	propertiesCount, err := s.repo.Count(ctx, filterQuery)
	if err != nil {
		return 0, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "CountProperties",
				"action":   "counting properties",
			},
		})
	}

	return propertiesCount, nil
}

func (s *propertyService) GetProperty(
	ctx context.Context,
	query repository.GetPropertyQuery,
) (*models.Property, error) {
	property, err := s.repo.GetByID(ctx, query)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("PropertyNotFound", &pkg.RentLoopErrorParams{
				Err: err,
			})
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err: err,
			Metadata: map[string]string{
				"function": "GetProperty",
				"action":   "fetching property by ID",
			},
		})
	}

	return property, nil
}

type UpdatePropertyInput struct {
	PropertyID  string
	ClientID    string
	Name        *string
	Currency    *string
	Description lib.Optional[string]
	Images      lib.Optional[[]string]
	Tags        lib.Optional[[]string]
	Modes       lib.Optional[[]string]
	Latitude    *float64
	Longitude   *float64
	Address     *string
	Country     *string
	Region      *string
	City        *string
	GPSAddress  lib.Optional[string]
	Type        *string
	Status      *string
}

func (s *propertyService) UpdateProperty(
	context context.Context,
	input UpdatePropertyInput,
) (*models.Property, error) {
	property, err := s.repo.GetByQuery(
		context,
		map[string]any{"id": input.PropertyID, "client_id": input.ClientID},
	)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err: err,
				Metadata: map[string]string{
					"function": "UpdateProperty",
					"action":   "get property by id",
				},
			})
		}

		return nil, pkg.NotFoundError("PropertyNotFound", &pkg.RentLoopErrorParams{
			Err: err,
		})
	}

	if input.Currency != nil {
		if !lib.IsSupportedCurrency(*input.Currency) {
			return nil, pkg.BadRequestError("UnsupportedCurrency", nil)
		}
		property.Currency = *input.Currency
	}

	if input.Name != nil {
		property.Name = *input.Name
	}

	if input.Description.IsSet {
		property.Description = input.Description.Value
	}

	if input.Images.IsSet {
		if input.Images.Value != nil {
			property.Images = pq.StringArray(*input.Images.Value)
		} else {
			property.Images = pq.StringArray{}
		}
	}

	if input.Tags.IsSet {
		if input.Tags.Value != nil {
			property.Tags = pq.StringArray(*input.Tags.Value)
		} else {
			property.Tags = pq.StringArray{}
		}
	}

	if input.Modes.IsSet {
		if input.Modes.Value != nil {
			property.Modes = pq.StringArray(*input.Modes.Value)
		} else {
			property.Modes = pq.StringArray{}
		}
	}

	if input.Latitude != nil {
		property.Latitude = *input.Latitude
	}

	if input.Longitude != nil {
		property.Longitude = *input.Longitude
	}

	if input.Address != nil {
		property.Address = *input.Address
	}

	if input.Country != nil {
		property.Country = *input.Country
	}

	if input.Region != nil {
		property.Region = *input.Region
	}

	if input.City != nil {
		property.City = *input.City
	}

	if input.GPSAddress.IsSet {
		property.GPSAddress = input.GPSAddress.Value
	}

	if input.Type != nil {
		newType := *input.Type
		if newType != property.Type && property.Type == "MULTI" && newType == "SINGLE" {
			unitsCount, unitsCountErr := s.unitService.CountUnits(
				context,
				repository.ListUnitsFilter{PropertyID: property.ID.String()},
			)
			if unitsCountErr != nil {
				return nil, unitsCountErr
			}
			if unitsCount > 1 {
				return nil, pkg.BadRequestError(
					"property has more than 1 unit; remove units before switching to SINGLE",
					nil,
				)
			}

			blocksCount, blocksCountErr := s.propertyBlockService.CountPropertyBlocks(
				context,
				repository.ListPropertyBlocksFilter{PropertyID: property.ID.String()},
			)
			if blocksCountErr != nil {
				return nil, blocksCountErr
			}
			if blocksCount > 1 {
				return nil, pkg.BadRequestError(
					"property has more than 1 block; remove blocks before switching to SINGLE",
					nil,
				)
			}
		}
		property.Type = newType
	}

	if input.Status != nil {
		newStatus := *input.Status
		if newStatus != property.Status {
			isGoingOffline := newStatus == "Property.Status.Inactive" || newStatus == "Property.Status.Maintenance"
			if property.Status == "Property.Status.Active" && isGoingOffline {
				activeLeaseCount, activeLeaseCountErr := s.leaseRepo.CountActiveByPropertyID(
					context,
					property.ID.String(),
				)
				if activeLeaseCountErr != nil {
					return nil, pkg.InternalServerError(activeLeaseCountErr.Error(), &pkg.RentLoopErrorParams{
						Err: activeLeaseCountErr,
						Metadata: map[string]string{
							"function": "UpdateProperty",
							"action":   "counting active leases for property",
						},
					})
				}
				if activeLeaseCount > 0 {
					return nil, pkg.BadRequestError(
						"property has active or pending leases; vacate all tenants before changing status",
						nil,
					)
				}
			}
			property.Status = newStatus
		}
	}

	if updateErr := s.repo.Update(context, property); updateErr != nil {
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "UpdateProperty",
				"action":   "updating property details",
			},
		})
	}

	return property, nil
}

type PropertyDeletionBlockingReason struct {
	Type   string `json:"type"`
	Status string `json:"status"`
	Count  int64  `json:"count"`
	Label  string `json:"label"`
}

type PropertyDeletionSummary struct {
	Blocks             int64 `json:"blocks"`
	Units              int64 `json:"units"`
	Leases             int64 `json:"leases"`
	Bookings           int64 `json:"bookings"`
	TenantApplications int64 `json:"tenant_applications"`
}

type PropertyDeletionEligibility struct {
	CanDelete       bool                             `json:"can_delete"`
	BlockingReasons []PropertyDeletionBlockingReason `json:"blocking_reasons"`
	WillBeDeleted   PropertyDeletionSummary          `json:"will_be_deleted"`
}

type GetPropertyDeletionEligibilityInput struct {
	PropertyID string
	ClientID   string
}

func (s *propertyService) GetPropertyDeletionEligibility(
	ctx context.Context,
	input GetPropertyDeletionEligibilityInput,
) (*PropertyDeletionEligibility, error) {
	property, propertyErr := s.repo.GetByQuery(
		ctx,
		map[string]any{"id": input.PropertyID, "client_id": input.ClientID},
	)
	if propertyErr != nil {
		if !errors.Is(propertyErr, gorm.ErrRecordNotFound) {
			return nil, pkg.InternalServerError(propertyErr.Error(), &pkg.RentLoopErrorParams{
				Err: propertyErr,
				Metadata: map[string]string{
					"function": "GetPropertyDeletionEligibility",
					"action":   "fetching property by ID",
				},
			})
		}

		return nil, pkg.NotFoundError("PropertyNotFound", &pkg.RentLoopErrorParams{
			Err: propertyErr,
		})
	}

	blockingReasons := []PropertyDeletionBlockingReason{}

	leaseStatuses := []struct{ status, label string }{
		{"Lease.Status.Pending", "Pending leases"},
		{"Lease.Status.Active", "Active leases"},
	}
	for _, ls := range leaseStatuses {
		count, countErr := s.leaseRepo.CountByPropertyIDAndStatus(ctx, property.ID.String(), ls.status)
		if countErr != nil {
			return nil, pkg.InternalServerError(countErr.Error(), &pkg.RentLoopErrorParams{
				Err: countErr,
				Metadata: map[string]string{
					"function": "GetPropertyDeletionEligibility",
					"action":   "counting leases by status",
				},
			})
		}
		if count > 0 {
			blockingReasons = append(blockingReasons, PropertyDeletionBlockingReason{
				Type: "LEASE", Status: ls.status, Count: count, Label: ls.label,
			})
		}
	}

	bookingStatuses := []struct{ status, label string }{
		{"PENDING", "Pending bookings"},
		{"CONFIRMED", "Confirmed bookings"},
		{"CHECKED_IN", "Checked-in bookings"},
	}
	for _, bs := range bookingStatuses {
		status := bs.status
		count, countErr := s.bookingRepo.Count(
			ctx,
			lib.FilterQuery{},
			repository.ListBookingsFilter{PropertyID: &input.PropertyID, Status: &status},
		)
		if countErr != nil {
			return nil, pkg.InternalServerError(countErr.Error(), &pkg.RentLoopErrorParams{
				Err: countErr,
				Metadata: map[string]string{
					"function": "GetPropertyDeletionEligibility",
					"action":   "counting bookings by status",
				},
			})
		}
		if count > 0 {
			blockingReasons = append(blockingReasons, PropertyDeletionBlockingReason{
				Type: "BOOKING", Status: bs.status, Count: count, Label: bs.label,
			})
		}
	}

	applicationStatus := "TenantApplication.Status.InProgress"
	applicationCount, applicationCountErr := s.tenantApplicationRepo.Count(
		ctx,
		repository.ListTenantApplicationsQuery{PropertyId: &input.PropertyID, Status: &applicationStatus},
	)
	if applicationCountErr != nil {
		return nil, pkg.InternalServerError(applicationCountErr.Error(), &pkg.RentLoopErrorParams{
			Err: applicationCountErr,
			Metadata: map[string]string{
				"function": "GetPropertyDeletionEligibility",
				"action":   "counting in-progress tenant applications",
			},
		})
	}
	if applicationCount > 0 {
		blockingReasons = append(blockingReasons, PropertyDeletionBlockingReason{
			Type:   "TENANT_APPLICATION",
			Status: applicationStatus,
			Count:  applicationCount,
			Label:  "Pending lease applications",
		})
	}

	blocksCount, blocksCountErr := s.propertyBlockService.CountPropertyBlocks(
		ctx, repository.ListPropertyBlocksFilter{PropertyID: property.ID.String()},
	)
	if blocksCountErr != nil {
		return nil, blocksCountErr
	}

	unitsCount, unitsCountErr := s.unitService.CountUnits(
		ctx, repository.ListUnitsFilter{PropertyID: property.ID.String()},
	)
	if unitsCountErr != nil {
		return nil, unitsCountErr
	}

	nonBlockingLeases, leasesErr := s.leaseRepo.CountNonBlockingByPropertyID(ctx, property.ID.String())
	if leasesErr != nil {
		return nil, pkg.InternalServerError(leasesErr.Error(), &pkg.RentLoopErrorParams{
			Err: leasesErr,
			Metadata: map[string]string{
				"function": "GetPropertyDeletionEligibility",
				"action":   "counting non-blocking leases",
			},
		})
	}

	nonBlockingBookings, bookingsErr := s.bookingRepo.CountNonBlockingByPropertyID(ctx, property.ID.String())
	if bookingsErr != nil {
		return nil, pkg.InternalServerError(bookingsErr.Error(), &pkg.RentLoopErrorParams{
			Err: bookingsErr,
			Metadata: map[string]string{
				"function": "GetPropertyDeletionEligibility",
				"action":   "counting non-blocking bookings",
			},
		})
	}

	nonBlockingApplications, applicationsErr := s.tenantApplicationRepo.CountNonBlockingByPropertyID(
		ctx,
		property.ID.String(),
	)
	if applicationsErr != nil {
		return nil, pkg.InternalServerError(applicationsErr.Error(), &pkg.RentLoopErrorParams{
			Err: applicationsErr,
			Metadata: map[string]string{
				"function": "GetPropertyDeletionEligibility",
				"action":   "counting non-blocking tenant applications",
			},
		})
	}

	return &PropertyDeletionEligibility{
		CanDelete:       len(blockingReasons) == 0,
		BlockingReasons: blockingReasons,
		WillBeDeleted: PropertyDeletionSummary{
			Blocks:             blocksCount,
			Units:              unitsCount,
			Leases:             nonBlockingLeases,
			Bookings:           nonBlockingBookings,
			TenantApplications: nonBlockingApplications,
		},
	}, nil
}

type DeletePropertyInput struct {
	PropertyID  string
	ClientID    string
	DeletedByID string
}

func (s *propertyService) DeleteProperty(context context.Context, input DeletePropertyInput) error {
	property, propertyErr := s.repo.GetByQuery(
		context,
		map[string]any{"id": input.PropertyID, "client_id": input.ClientID},
	)
	if propertyErr != nil {
		if !errors.Is(propertyErr, gorm.ErrRecordNotFound) {
			return pkg.InternalServerError(propertyErr.Error(), &pkg.RentLoopErrorParams{
				Err: propertyErr,
				Metadata: map[string]string{
					"function": "DeleteProperty",
					"action":   "fetching property by ID",
				},
			})
		}

		return pkg.NotFoundError("PropertyNotFound", &pkg.RentLoopErrorParams{
			Err: propertyErr,
		})
	}

	tx := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(context, tx)

	eligibility, eligibilityErr := s.GetPropertyDeletionEligibility(transCtx, GetPropertyDeletionEligibilityInput{
		PropertyID: input.PropertyID,
		ClientID:   input.ClientID,
	})
	if eligibilityErr != nil {
		tx.Rollback()
		return eligibilityErr
	}

	if !eligibility.CanDelete {
		tx.Rollback()
		return pkg.BadRequestError("PropertyHasActiveOccupancy", nil)
	}

	// Only the ClientUserProperty links get removed alongside the property —
	// this gates MANAGER/STAFF workspace access, not tenant-facing data, and
	// isn't restored when the property is restored (a workspace-access
	// detail, distinct from the tenant-facing entities below).
	unlinkPropertyErr := s.clientUserPropertyService.UnlinkByPropertyID(transCtx, input.PropertyID)
	if unlinkPropertyErr != nil {
		tx.Rollback()
		return unlinkPropertyErr
	}

	// Units, blocks, leases, bookings and tenant applications are NOT
	// soft-deleted here. A tenant's past lease or application belongs to
	// their own account history, independent of the property — deleting it
	// would hide it from the tenant, not just from the property manager.
	// Since every PM-side path to this data goes through fetching the
	// Property row first (default-scoped to exclude soft-deleted rows) or
	// joins against `properties.deleted_at IS NULL`, soft-deleting only the
	// property already makes all of it unreachable from the PM portal —
	// without touching the child rows.
	property.DeletedByID = &input.DeletedByID
	if updateErr := s.repo.Update(transCtx, property); updateErr != nil {
		tx.Rollback()
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err: updateErr,
			Metadata: map[string]string{
				"function": "DeleteProperty",
				"action":   "recording who deleted the property",
			},
		})
	}

	deletePropertyErr := s.repo.Delete(transCtx, input.PropertyID)
	if deletePropertyErr != nil {
		tx.Rollback()
		return pkg.InternalServerError(deletePropertyErr.Error(), &pkg.RentLoopErrorParams{
			Err: deletePropertyErr,
			Metadata: map[string]string{
				"function": "DeleteProperty",
				"action":   "deleting property",
			},
		})
	}

	commitErr := tx.Commit().Error
	if commitErr != nil {
		tx.Rollback()
		return commitErr
	}

	return nil
}

func (s *propertyService) GetPropertyBySlug(
	ctx context.Context,
	query repository.GetPropertyBySlugQuery,
) (*models.Property, error) {
	property, getErr := s.repo.GetBySlug(ctx, query)
	if getErr != nil {
		if errors.Is(getErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("PropertyNotFound", &pkg.RentLoopErrorParams{
				Err: getErr,
			})
		}

		return nil, pkg.InternalServerError(getErr.Error(), &pkg.RentLoopErrorParams{
			Err: getErr,
			Metadata: map[string]string{
				"function": "GetPropertyBySlug",
				"action":   "get property by slug",
			},
		})
	}

	return property, nil
}

type PropertyRestorePreview struct {
	Blocks             int64 `json:"blocks"`
	Units              int64 `json:"units"`
	Leases             int64 `json:"leases"`
	Bookings           int64 `json:"bookings"`
	TenantApplications int64 `json:"tenant_applications"`
}

type GetPropertyRestorePreviewInput struct {
	PropertyID string
	ClientID   string
}

func (s *propertyService) GetPropertyRestorePreview(
	ctx context.Context,
	input GetPropertyRestorePreviewInput,
) (*PropertyRestorePreview, error) {
	property, propertyErr := s.repo.GetByQueryUnscoped(
		ctx,
		map[string]any{"id": input.PropertyID, "client_id": input.ClientID},
	)
	if propertyErr != nil {
		if errors.Is(propertyErr, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("PropertyNotFound", &pkg.RentLoopErrorParams{
				Err: propertyErr,
			})
		}
		return nil, pkg.InternalServerError(propertyErr.Error(), &pkg.RentLoopErrorParams{
			Err: propertyErr,
			Metadata: map[string]string{
				"function": "GetPropertyRestorePreview",
				"action":   "fetching property by ID",
			},
		})
	}

	if !property.DeletedAt.Valid {
		return nil, pkg.BadRequestError("PropertyNotArchived", nil)
	}

	leasesCount, leasesErr := s.leaseRepo.CountNonBlockingByPropertyID(ctx, property.ID.String())
	if leasesErr != nil {
		return nil, pkg.InternalServerError(leasesErr.Error(), &pkg.RentLoopErrorParams{
			Err: leasesErr,
			Metadata: map[string]string{
				"function": "GetPropertyRestorePreview",
				"action":   "counting leases",
			},
		})
	}

	bookingsCount, bookingsErr := s.bookingRepo.CountNonBlockingByPropertyID(ctx, property.ID.String())
	if bookingsErr != nil {
		return nil, pkg.InternalServerError(bookingsErr.Error(), &pkg.RentLoopErrorParams{
			Err: bookingsErr,
			Metadata: map[string]string{
				"function": "GetPropertyRestorePreview",
				"action":   "counting bookings",
			},
		})
	}

	applicationsCount, applicationsErr := s.tenantApplicationRepo.CountNonBlockingByPropertyID(
		ctx,
		property.ID.String(),
	)
	if applicationsErr != nil {
		return nil, pkg.InternalServerError(applicationsErr.Error(), &pkg.RentLoopErrorParams{
			Err: applicationsErr,
			Metadata: map[string]string{
				"function": "GetPropertyRestorePreview",
				"action":   "counting tenant applications",
			},
		})
	}

	return &PropertyRestorePreview{
		Blocks:             int64(property.BlocksCount),
		Units:              int64(property.UnitsCount),
		Leases:             leasesCount,
		Bookings:           bookingsCount,
		TenantApplications: applicationsCount,
	}, nil
}

type RestorePropertyInput struct {
	PropertyID   string
	ClientID     string
	RestoredByID string
}

func (s *propertyService) RestoreProperty(ctx context.Context, input RestorePropertyInput) error {
	property, propertyErr := s.repo.GetByQueryUnscoped(
		ctx,
		map[string]any{"id": input.PropertyID, "client_id": input.ClientID},
	)
	if propertyErr != nil {
		if errors.Is(propertyErr, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("PropertyNotFound", &pkg.RentLoopErrorParams{
				Err: propertyErr,
			})
		}
		return pkg.InternalServerError(propertyErr.Error(), &pkg.RentLoopErrorParams{
			Err: propertyErr,
			Metadata: map[string]string{
				"function": "RestoreProperty",
				"action":   "fetching property by ID",
			},
		})
	}

	if !property.DeletedAt.Valid {
		return pkg.BadRequestError("PropertyNotArchived", nil)
	}

	tx := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, tx)

	if restoreErr := s.repo.RestoreByID(transCtx, property.ID.String()); restoreErr != nil {
		tx.Rollback()
		return pkg.InternalServerError(restoreErr.Error(), &pkg.RentLoopErrorParams{
			Err: restoreErr,
			Metadata: map[string]string{
				"function": "RestoreProperty",
				"action":   "restoring property",
			},
		})
	}

	// The property lost its ClientUserProperty links when it was deleted
	// (see DeleteProperty). Restore access for the client's OWNER — and,
	// if a different ADMIN is the one restoring it, for that ADMIN too —
	// so at least someone can manage the property again. Other previously
	// assigned MANAGERs/STAFF are not automatically re-linked; an
	// OWNER/ADMIN can re-invite them manually.
	clientUserOwner, clientUserErr := s.clientUserService.GetClientUserByQuery(
		transCtx,
		map[string]any{"client_id": input.ClientID, "role": "OWNER"},
	)
	if clientUserErr != nil {
		tx.Rollback()
		return clientUserErr
	}

	ownerClientUserProperty := CreateClientUserPropertyInput{
		PropertyID:   property.ID.String(),
		ClientUserID: clientUserOwner.ID.String(),
		Role:         "MANAGER",
		CreatedByID:  &input.RestoredByID,
	}

	_, linkOwnerErr := s.clientUserPropertyService.LinkClientUserProperty(
		transCtx,
		ownerClientUserProperty,
	)
	if linkOwnerErr != nil {
		tx.Rollback()
		return linkOwnerErr
	}

	if clientUserOwner.ID.String() != input.RestoredByID {
		restorerClientUserProperty := CreateClientUserPropertyInput{
			PropertyID:   property.ID.String(),
			ClientUserID: input.RestoredByID,
			Role:         "MANAGER",
			CreatedByID:  &input.RestoredByID,
		}

		_, linkRestorerErr := s.clientUserPropertyService.LinkClientUserProperty(
			transCtx,
			restorerClientUserProperty,
		)
		if linkRestorerErr != nil {
			tx.Rollback()
			return linkRestorerErr
		}
	}

	if commitErr := tx.Commit().Error; commitErr != nil {
		tx.Rollback()
		return commitErr
	}

	return nil
}
