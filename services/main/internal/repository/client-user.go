package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

type ClientUserRepository interface {
	Create(context context.Context, clientUser *models.ClientUser) error
	GetByID(context context.Context, id string) (*models.ClientUser, error)
	GetByQuery(context context.Context, query map[string]any) (*models.ClientUser, error)
	Update(context context.Context, clientUser *models.ClientUser) error
	Delete(context context.Context, clientUser *models.ClientUser) error
	List(context context.Context, filterQuery ListClientUsersFilter) (*[]models.ClientUser, error)
	Count(context context.Context, filterQuery ListClientUsersFilter) (int64, error)
	GetByIDWithPopulate(
		context context.Context,
		query GetClientUserWithPopulateQuery,
	) (*models.ClientUser, error)
}

type clientUserRepository struct {
	DB *gorm.DB
}

func NewClientUserRepository(DB *gorm.DB) ClientUserRepository {
	return &clientUserRepository{DB}
}

func (r *clientUserRepository) Create(ctx context.Context, clientUser *models.ClientUser) error {
	db := lib.ResolveDB(ctx, r.DB)
	return db.WithContext(ctx).Create(clientUser).Error
}

func (r *clientUserRepository) GetByID(ctx context.Context, id string) (*models.ClientUser, error) {
	var clientUser models.ClientUser
	result := r.DB.WithContext(ctx).Where("id = ?", id).First(&clientUser)

	if result.Error != nil {
		return nil, result.Error
	}
	return &clientUser, nil
}

func (r *clientUserRepository) GetByQuery(
	ctx context.Context,
	query map[string]any,
) (*models.ClientUser, error) {
	var clientUser models.ClientUser
	result := r.DB.WithContext(ctx).Where(query).First(&clientUser)

	if result.Error != nil {
		return nil, result.Error
	}

	return &clientUser, nil
}

func (r *clientUserRepository) Update(ctx context.Context, clientUser *models.ClientUser) error {
	return r.DB.WithContext(ctx).Save(clientUser).Error
}

func (r *clientUserRepository) Delete(ctx context.Context, clientUser *models.ClientUser) error {
	db := lib.ResolveDB(ctx, r.DB)

	return db.WithContext(ctx).Delete(clientUser).Error
}

type GetClientUserWithPopulateQuery struct {
	ID       string
	ClientID string
	Populate *[]string
}

func (r *clientUserRepository) GetByIDWithPopulate(
	ctx context.Context,
	query GetClientUserWithPopulateQuery,
) (*models.ClientUser, error) {
	var clientUser models.ClientUser

	db := r.DB.WithContext(ctx).Where("id = ? AND client_id = ?", query.ID, query.ClientID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	result := db.First(&clientUser)
	if result.Error != nil {
		return nil, result.Error
	}

	return &clientUser, nil
}

type ListClientUsersFilter struct {
	lib.FilterQuery
	ClientID        string
	Role            *string
	Status          *string
	NotInPropertyID *string
	UserEmail       *string
	UserPhone       *string
}

func (r *clientUserRepository) List(
	ctx context.Context,
	filterQuery ListClientUsersFilter,
) (*[]models.ClientUser, error) {
	var clientUsers []models.ClientUser

	db := r.DB.WithContext(ctx).Scopes(clientUserFilterScopes(filterQuery)...).Scopes(
		PaginationScope(filterQuery.Page, filterQuery.PageSize),
		OrderScope("client_users", filterQuery.OrderBy, filterQuery.Order),
	)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	results := db.Find(&clientUsers)
	if results.Error != nil {
		return nil, results.Error
	}

	return &clientUsers, nil
}

func (r *clientUserRepository) Count(
	ctx context.Context,
	filterQuery ListClientUsersFilter,
) (int64, error) {
	var count int64

	result := r.DB.WithContext(ctx).
		Model(&models.ClientUser{}).
		Scopes(clientUserFilterScopes(filterQuery)...).
		Count(&count)

	if result.Error != nil {
		return 0, result.Error
	}

	return count, nil
}

// clientUserFilterScopes is the filtering List and Count must agree on: a row
// the list shows but the count omits (or the reverse) mispages the table.
// The users join is resolved here, once for the whole statement, because both
// the user filters and the identity search need it and Postgres rejects the
// same table joined twice.
func clientUserFilterScopes(filterQuery ListClientUsersFilter) []func(db *gorm.DB) *gorm.DB {
	needsUserJoin := filterQuery.UserEmail != nil ||
		filterQuery.UserPhone != nil ||
		searchesUserIdentity(filterQuery.Search)

	return []func(db *gorm.DB) *gorm.DB{
		IDsFilterScope("client_users", filterQuery.IDs),
		ClientFilterScope("client_users", filterQuery.ClientID),
		roleFilterScope(filterQuery.Role),
		statusFilterScope(filterQuery.Status),
		notInPropertyScope(filterQuery.NotInPropertyID),
		joinUsersScope(needsUserJoin),
		userFilterScope(filterQuery.UserEmail, filterQuery.UserPhone),
		DateRangeScope("client_users", filterQuery.DateRange),
		clientUserSearchScope(filterQuery.Search),
	}
}

func joinUsersScope(needed bool) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if !needed {
			return db
		}

		return db.Joins("JOIN users ON users.id = client_users.user_id AND users.deleted_at IS NULL")
	}
}

func roleFilterScope(role *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if role == nil {
			return db
		}

		return db.Where("client_users.role = ?", role)
	}
}

func statusFilterScope(status *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if status == nil {
			return db
		}

		return db.Where("client_users.status = ?", status)
	}
}

// userFilterScope assumes joinUsersScope has already put users in scope for
// this statement -- see clientUserFilterScopes.
func userFilterScope(email *string, phone *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if email == nil && phone == nil {
			return db
		}

		if email != nil {
			db = db.Where("users.email = ?", *email)
		}

		if phone != nil {
			db = db.Where("users.phone_number = ?", *phone)
		}

		return db
	}
}

// clientUserIdentityFields are the fields the portals let you search a member
// by. They read as ClientUser fields, but a member's identity lives on the
// shared users row -- client_users has had no name, email or phone_number
// column since users were split out -- so they resolve against the join.
var clientUserIdentityFields = map[string]struct{}{
	"name":         {},
	"email":        {},
	"phone_number": {},
}

func searchesUserIdentity(search *lib.Search) bool {
	if search == nil || search.Query == "" {
		return false
	}

	for _, field := range search.SearchFields {
		if _, ok := clientUserIdentityFields[field]; ok {
			return true
		}
	}

	return false
}

// clientUserSearchScope is SearchScope with the client_users/users split folded
// in: identity fields resolve against the joined users row, everything else
// against client_users. It assumes joinUsersScope ran -- see
// clientUserFilterScopes.
func clientUserSearchScope(search *lib.Search) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if search == nil || search.Query == "" {
			return db
		}

		conditions := make([]string, 0, len(search.SearchFields))
		args := make([]any, 0, len(search.SearchFields))

		for _, field := range search.SearchFields {
			column, ok := clientUserSearchColumn(db.NamingStrategy, field)
			if !ok {
				continue
			}

			conditions = append(conditions, column+" ILIKE ?")
			args = append(args, fmt.Sprintf("%%%s%%", search.Query))
		}

		// Same contract as SearchScope: a search that narrowed to nothing
		// matches nothing, rather than falling through unfiltered.
		if len(conditions) == 0 {
			return db.Where("1 = 0")
		}

		return db.Where("("+strings.Join(conditions, " OR ")+")", args...)
	}
}

// clientUserSearchColumn qualifies a client-supplied search field, or reports
// that it should be dropped. Fields naming no column at all are dropped rather
// than interpolated: `search_fields` comes straight off the query string, and a
// stale field from a shipped client should narrow the list, not 500 it.
func clientUserSearchColumn(namer schema.Namer, field string) (string, bool) {
	if !columnIdentifier.MatchString(field) {
		return "", false
	}

	if _, ok := clientUserIdentityFields[field]; ok {
		return "users." + field, true
	}

	if !clientUserHasColumn(namer, field) {
		return "", false
	}

	return "client_users." + field, true
}

// clientUserHasColumn reports whether column exists on client_users. A schema
// that cannot be parsed falls back to trusting the caller, matching how
// filterPopulatePaths degrades.
func clientUserHasColumn(namer schema.Namer, column string) bool {
	parsed, err := schema.Parse(&models.ClientUser{}, populateSchemaCache, namer)
	if err != nil {
		return true
	}

	_, ok := parsed.FieldsByDBName[column]

	return ok
}

func notInPropertyScope(propertyID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if propertyID == nil {
			return db
		}

		return db.Joins(
			"LEFT JOIN client_user_properties ON client_users.id = client_user_properties.client_user_id AND client_user_properties.property_id = ? AND client_user_properties.deleted_at IS NULL",
			propertyID,
		).Where("client_user_properties.client_user_id IS NULL")
	}
}
