package lib

import (
	"encoding/json"
	"reflect"
	"time"

	"github.com/go-playground/validator/v10"
)

// OptionalValue is an interface implemented by all Optional[T] types
// to allow generic extraction of the underlying value for validation.
type OptionalValue interface {
	// GetValue returns the underlying value as an interface{}.
	// Returns nil if not set or the value is nil.
	GetValue() any
	// WasSet returns true if the field was present in JSON.
	WasSet() bool
}

// Optional wraps a pointer and tracks if it was explicitly set in JSON.
// This allows distinguishing between "field not sent" vs "field set to null" vs "field set to value".
type Optional[T any] struct {
	Value *T
	IsSet bool
}

// UnmarshalJSON implements json.Unmarshaler.
// It sets IsSet to true whenever the field is present in JSON (even if null).
func (o *Optional[T]) UnmarshalJSON(data []byte) error {
	o.IsSet = true

	// If the JSON value is null, leave Value as nil
	if string(data) == "null" {
		o.Value = nil
		return nil
	}

	// Otherwise, unmarshal into a new value
	var v T
	if err := json.Unmarshal(data, &v); err != nil {
		return err
	}
	o.Value = &v
	return nil
}

// MarshalJSON implements json.Marshaler.
// If not set or Value is nil, it marshals to null.
func (o Optional[T]) MarshalJSON() ([]byte, error) {
	if !o.IsSet || o.Value == nil {
		return []byte("null"), nil
	}
	return json.Marshal(o.Value)
}

// Get returns the value if set and not nil, otherwise returns the zero value.
func (o Optional[T]) Get() T {
	if o.Value != nil {
		return *o.Value
	}
	var zero T
	return zero
}

// GetOr returns the value if set and not nil, otherwise returns the provided default.
func (o Optional[T]) GetOr(defaultVal T) T {
	if o.Value != nil {
		return *o.Value
	}
	return defaultVal
}

// Ptr returns the underlying pointer (may be nil).
func (o Optional[T]) Ptr() *T {
	return o.Value
}

// GetValue implements OptionalValue interface.
func (o Optional[T]) GetValue() any {
	if o.Value == nil {
		return nil
	}
	return *o.Value
}

// WasSet implements OptionalValue interface.
func (o Optional[T]) WasSet() bool {
	return o.IsSet
}

// Ensure Optional implements OptionalValue at compile time.
var (
	_ OptionalValue = Optional[string]{}
	_ OptionalValue = Optional[int64]{}
	_ OptionalValue = Optional[time.Time]{}
)

// optionalCustomTypeFunc extracts the underlying value from Optional types for validation.
func optionalCustomTypeFunc(field reflect.Value) any {
	if field.CanInterface() {
		if opt, ok := field.Interface().(OptionalValue); ok {
			return opt.GetValue()
		}
	}
	return nil
}

// NewValidator creates a validator instance configured to handle Optional types.
func NewValidator() *validator.Validate {
	v := validator.New()

	// Register custom type func for all Optional types
	v.RegisterCustomTypeFunc(optionalCustomTypeFunc,
		Optional[string]{},
		Optional[int64]{},
		Optional[time.Time]{},
	)

	return v
}
