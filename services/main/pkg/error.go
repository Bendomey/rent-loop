package pkg

import (
	"errors"
	"fmt"
	"net/http"
	"runtime"

	"github.com/getsentry/raven-go"
)

type IRentLoopError struct {
	Code     int
	Message  string
	Metadata map[string]string
	Err      error
	File     string
	Line     int
}

type RentLoopErrorParams struct {
	Code     int
	Metadata map[string]string
	Err      error
}

// NOTE: RentLoopError should only be used in our service functions. anywhere else should use golang base error.
func RentLoopError(msg string, params *RentLoopErrorParams) *IRentLoopError {
	_, file, line, _ := runtime.Caller(1)

	code := http.StatusBadRequest
	meta := map[string]string{}
	var err error

	if params != nil {
		code = params.Code
		meta = params.Metadata
		err = params.Err
	}

	if err == nil {
		err = errors.New(msg)
	}

	if code >= 500 {
		raven.CaptureError(err, mergeMaps(meta, map[string]string{
			"file": file,
			"line": fmt.Sprintf("%d", line),
		}))
	}

	return &IRentLoopError{
		Code:     code,
		Message:  msg,
		File:     file,
		Err:      err,
		Line:     line,
		Metadata: meta,
	}
}

func (e *IRentLoopError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%d] %s (%s:%d): %v", e.Code, e.Message, e.File, e.Line, e.Err)
	}

	return fmt.Sprintf("[%d] %s (%s:%d)", e.Code, e.Message, e.File, e.Line)
}

func (e *IRentLoopError) Unwrap() error {
	return e.Err
}

// Helper functions for common HTTP errors
func BadRequestError(msg string, params *RentLoopErrorParams) *IRentLoopError {
	if params == nil {
		params = &RentLoopErrorParams{}
	}
	params.Code = http.StatusBadRequest
	return RentLoopError(msg, params)
}

func UnauthorizedError(msg string, params *RentLoopErrorParams) *IRentLoopError {
	if params == nil {
		params = &RentLoopErrorParams{}
	}
	params.Code = http.StatusUnauthorized
	return RentLoopError(msg, params)
}

func ForbiddenError(msg string, params *RentLoopErrorParams) *IRentLoopError {
	if params == nil {
		params = &RentLoopErrorParams{}
	}
	params.Code = http.StatusForbidden
	return RentLoopError(msg, params)
}

func NotFoundError(msg string, params *RentLoopErrorParams) *IRentLoopError {
	if params == nil {
		params = &RentLoopErrorParams{}
	}
	params.Code = http.StatusNotFound
	return RentLoopError(msg, params)
}

func ConflictError(msg string, params *RentLoopErrorParams) *IRentLoopError {
	if params == nil {
		params = &RentLoopErrorParams{}
	}
	params.Code = http.StatusConflict
	return RentLoopError(msg, params)
}

func InternalServerError(msg string, params *RentLoopErrorParams) *IRentLoopError {
	if params == nil {
		params = &RentLoopErrorParams{}
	}
	params.Code = http.StatusInternalServerError
	return RentLoopError(msg, params)
}

func mergeMaps(map1, map2 map[string]string) map[string]string {
	merged := make(map[string]string)

	for k, v := range map1 {
		merged[k] = v
	}

	for k, v := range map2 {
		merged[k] = v
	}

	return merged
}
