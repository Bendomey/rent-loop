package gatekeeper

import (
	"fmt"
	"strings"
)

type GatekeeperAPIError struct {
	StatusCode        int
	Title             string
	Message           *string
	AttemptsRemaining *int
}

type GatekeeperAPIErrorParams struct {
	StatusCode        int
	Title             string
	Message           *string
	AttemptsRemaining *int
}

func (e *GatekeeperAPIError) Error() string {
	var attemptsRemaining string
	if e.AttemptsRemaining != nil {
		attemptsRemaining = fmt.Sprintf("- attempts remaining: %d", *e.AttemptsRemaining)
	}

	message := fmt.Sprintf("gatekeeper API error [%d]: %s %s", e.StatusCode, e.Title, attemptsRemaining)

	return strings.TrimSpace(message)
}

func NewGatekeeperAPIError(params GatekeeperAPIErrorParams) *GatekeeperAPIError {
	return &GatekeeperAPIError{
		StatusCode:        params.StatusCode,
		Title:             params.Title,
		Message:           params.Message,
		AttemptsRemaining: params.AttemptsRemaining,
	}
}
