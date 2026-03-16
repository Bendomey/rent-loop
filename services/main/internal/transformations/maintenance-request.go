package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

type AdminOutputMaintenanceRequest struct {
	ID                    string                         `json:"id"`
	Code                  string                         `json:"code"`
	UnitID                string                         `json:"unit_id"`
	Unit                  AdminOutputUnit                `json:"unit,omitempty"`
	LeaseID               *string                        `json:"lease_id,omitempty"`
	CreatedByTenantID     *string                        `json:"created_by_tenant_id,omitempty"`
	CreatedByClientUserID *string                        `json:"created_by_client_user_id,omitempty"`
	Title                 string                         `json:"title"`
	Description           string                         `json:"description"`
	Attachments           []string                       `json:"attachments"`
	Priority              string                         `json:"priority"`
	Category              string                         `json:"category"`
	Status                string                         `json:"status"`
	Visibility            string                         `json:"visibility"`
	AssignedWorkerID      *string                        `json:"assigned_worker_id,omitempty"`
	AssignedManagerID     *string                        `json:"assigned_manager_id,omitempty"`
	CancellationReason    *string                        `json:"cancellation_reason,omitempty"`
	StartedAt             *time.Time                     `json:"started_at,omitempty"`
	ReviewedAt            *time.Time                     `json:"reviewed_at,omitempty"`
	ResolvedAt            *time.Time                     `json:"resolved_at,omitempty"`
	CanceledAt            *time.Time                     `json:"canceled_at,omitempty"`
	Expenses              []OutputExpense                `json:"expenses,omitempty"`
	ActivityLogs          []OutputMaintenanceActivityLog `json:"activity_logs,omitempty"`
	CreatedAt             time.Time                      `json:"created_at"`
	UpdatedAt             time.Time                      `json:"updated_at"`
}

// DBMaintenanceRequestToRest transforms a MaintenanceRequest model to its PM/admin REST representation.
func DBMaintenanceRequestToRest(mr *models.MaintenanceRequest) any {
	if mr == nil {
		return nil
	}

	attachments := []string{}
	if mr.Attachments != nil {
		attachments = mr.Attachments
	}

	activityLogs := make([]any, len(mr.ActivityLogs))
	for i := range mr.ActivityLogs {
		activityLogs[i] = DBMaintenanceActivityLogToRest(&mr.ActivityLogs[i])
	}

	expenses := make([]any, len(mr.Expenses))
	for i := range mr.Expenses {
		expenses[i] = DBExpenseToRest(&mr.Expenses[i])
	}

	return map[string]any{
		"id":                        mr.ID.String(),
		"code":                      mr.Code,
		"unit_id":                   mr.UnitID,
		"unit":                      DBUnitToRest(&mr.Unit),
		"lease_id":                  mr.LeaseID,
		"created_by_tenant_id":      mr.CreatedByTenantID,
		"created_by_client_user_id": mr.CreatedByClientUserID,
		"title":                     mr.Title,
		"description":               mr.Description,
		"attachments":               attachments,
		"priority":                  mr.Priority,
		"category":                  mr.Category,
		"status":                    mr.Status,
		"visibility":                mr.Visibility,
		"assigned_worker_id":        mr.AssignedWorkerID,
		"assigned_manager_id":       mr.AssignedManagerID,
		"started_at":                mr.StartedAt,
		"reviewed_at":               mr.ReviewedAt,
		"resolved_at":               mr.ResolvedAt,
		"canceled_at":               mr.CanceledAt,
		"cancellation_reason":       mr.CancellationReason,
		"activity_logs":             activityLogs,
		"expenses":                  expenses,
		"created_at":                mr.CreatedAt,
		"updated_at":                mr.UpdatedAt,
	}
}

type OutputMaintenanceRequest struct {
	ID                 string                         `json:"id"`
	Code               string                         `json:"code"`
	UnitID             string                         `json:"unit_id"`
	Unit               OutputUnit                     `json:"unit,omitempty"`
	Title              string                         `json:"title"`
	Description        string                         `json:"description"`
	Attachments        []string                       `json:"attachments"`
	Priority           string                         `json:"priority"`
	Category           string                         `json:"category"`
	Status             string                         `json:"status"`
	StartedAt          *time.Time                     `json:"started_at,omitempty"`
	ResolvedAt         *time.Time                     `json:"resolved_at,omitempty"`
	CanceledAt         *time.Time                     `json:"canceled_at,omitempty"`
	CancellationReason *string                        `json:"cancellation_reason,omitempty"`
	Expenses           []OutputExpense                `json:"expenses,omitempty"`
	ActivityLogs       []OutputMaintenanceActivityLog `json:"activity_logs,omitempty"`
	CreatedAt          time.Time                      `json:"created_at"`
	UpdatedAt          time.Time                      `json:"updated_at"`
}

// DBMaintenanceRequestToTenantRest transforms a MaintenanceRequest to the tenant-facing representation.
func DBMaintenanceRequestToTenantRest(mr *models.MaintenanceRequest) any {
	if mr == nil {
		return nil
	}

	attachments := []string{}
	if mr.Attachments != nil {
		attachments = mr.Attachments
	}

	activityLogs := make([]any, len(mr.ActivityLogs))
	for i := range mr.ActivityLogs {
		activityLogs[i] = DBMaintenanceActivityLogToRest(&mr.ActivityLogs[i])
	}

	expenses := make([]any, len(mr.Expenses))
	for i := range mr.Expenses {
		expenses[i] = DBExpenseToRest(&mr.Expenses[i])
	}

	return map[string]any{
		"id":                  mr.ID.String(),
		"code":                mr.Code,
		"unit_id":             mr.UnitID,
		"title":               mr.Title,
		"description":         mr.Description,
		"attachments":         attachments,
		"priority":            mr.Priority,
		"category":            mr.Category,
		"status":              mr.Status,
		"started_at":          mr.StartedAt,
		"resolved_at":         mr.ResolvedAt,
		"canceled_at":         mr.CanceledAt,
		"cancellation_reason": mr.CancellationReason,
		"expenses":            expenses,
		"activity_logs":       activityLogs,
		"created_at":          mr.CreatedAt,
		"updated_at":          mr.UpdatedAt,
	}
}

type OutputMaintenanceActivityLog struct {
	ID                      string    `json:"id"`
	MaintenanceRequestID    string    `json:"maintenance_request_id"`
	Action                  string    `json:"action"`
	Description             *string   `json:"description"`
	PerformedByClientUserID *string   `json:"performed_by_client_user_id,omitempty"`
	PerformedByTenantID     *string   `json:"performed_by_tenant_id,omitempty"`
	Metadata                any       `json:"metadata,omitempty"`
	CreatedAt               time.Time `json:"created_at"`
	UpdatedAt               time.Time `json:"updated_at"`
}

// DBMaintenanceActivityLogToRest transforms a MaintenanceRequestActivityLog to REST.
func DBMaintenanceActivityLogToRest(log *models.MaintenanceRequestActivityLog) any {
	if log == nil {
		return nil
	}
	return map[string]any{
		"id":                          log.ID.String(),
		"maintenance_request_id":      log.MaintenanceRequestID,
		"action":                      log.Action,
		"description":                 log.Description,
		"performed_by_client_user_id": log.PerformedByClientUserID,
		"performed_by_tenant_id":      log.PerformedByTenantID,
		"metadata":                    log.Metadata,
		"created_at":                  log.CreatedAt,
		"updated_at":                  log.UpdatedAt,
	}
}

type OutputMaintenanceRequestComment struct {
	ID                    string           `json:"id"`
	MaintenanceRequestID  string           `json:"maintenance_request_id"`
	Content               string           `json:"content"`
	CreatedByClientUserID *string          `json:"created_by_client_user_id,omitempty"`
	CreatedByClientUser   OutputClientUser `json:"created_by_client_user,omitempty"`
	CreatedAt             time.Time        `json:"created_at"`
	UpdatedAt             time.Time        `json:"updated_at"`
}

// DBMaintenanceRequestCommentToRest transforms a MaintenanceRequestComment to REST.
func DBMaintenanceRequestCommentToRest(c *models.MaintenanceRequestComment) any {
	if c == nil {
		return nil
	}
	return map[string]any{
		"id":                        c.ID.String(),
		"maintenance_request_id":    c.MaintenanceRequestID,
		"content":                   c.Content,
		"created_by_client_user_id": c.CreatedByClientUserID,
		"created_by_client_user":    DBClientUserToRest(c.CreatedByClientUser),
		"created_at":                c.CreatedAt,
		"updated_at":                c.UpdatedAt,
	}
}
