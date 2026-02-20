package lib

import "encoding/json"

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
