package lib

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"

	"gorm.io/datatypes"
)

func ConvertStringToInt(intToBecome string) (int, error) {
	conv, convErr := strconv.Atoi(intToBecome)
	if convErr != nil {
		return 0, convErr
	}

	return conv, nil
}

func ConvertStringPointerToBoolPointer(boolToBecome *string) *bool {
	if boolToBecome == nil {
		return nil
	}

	conv := *boolToBecome == "true" || *boolToBecome == "1"
	return &conv
}

func NullOrString(input string) *string {
	if input == "" {
		return nil
	}

	return &input
}

func NullOrBool(input string) *bool {
	if input == "" {
		return nil
	}

	conv := input == "true" || input == "1"
	return &conv
}

func NullOrStringArray(input []string) *[]string {
	if len(input) == 0 {
		return nil
	}

	return &input
}

func InterfaceToJSON(input map[string]interface{}) (*datatypes.JSON, error) {
	var jsonData datatypes.JSON
	bytes, err := json.Marshal(input)
	if err != nil {
		return &jsonData, err
	}

	err = json.Unmarshal(bytes, &jsonData)
	return &jsonData, err
}

func StringPointer(s string) *string {
	return &s
}

func StringSliceToString(slice []string) string {
	result := ""
	for i, str := range slice {
		result += str
		if i < len(slice)-1 {
			result += ", "
		}
	}
	return result
}

func StringInSlice(target string, list []string) bool {
	for _, str := range list {
		if str == target {
			return true
		}
	}
	return false
}

// Usage
// var input Input

// // Case 1: Not provided
// input.Reference = NullableString{} // Set=false
// data, _ := json.Marshal(input)
// // => "{}"

// // Case 2: Explicit null
// input.Reference = NullableString{Set: true, Value: nil}
// data, _ := json.Marshal(input)
// // => {"reference":null}

// // Case 3: With value
// val := "hello"
// input.Reference = NullableString{Set: true, Value: &val}
// data, _ := json.Marshal(input}
// // => {"reference":"hello"}

type NullableInterface struct {
	Set   bool
	Value *map[string]interface{}
}

// Custom Unmarshal
func (ns *NullableInterface) UnmarshalJSON(data []byte) error {
	ns.Set = true
	if string(data) == "null" {
		ns.Value = nil
		return nil
	}
	var s map[string]interface{}
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	ns.Value = &s
	return nil
}

// Encode NullableInterface into JSON
func (ns NullableInterface) MarshalJSON() ([]byte, error) {
	if !ns.Set {
		// If not set, omit field → return empty bytes so encoding/json
		// will respect `omitempty`
		return []byte("null"), nil // will still output `"reference":null` unless omitempty used
	}
	if ns.Value == nil {
		return []byte("null"), nil
	}
	return json.Marshal(*ns.Value)
}

// Always return a string, even if the pointer is nil.
func SafeString(s *string) string {
	if s == nil {
		return ""
	}

	return *s
}

// Convert a bool pointer to a string.
func BoolToString(b *bool) string {
	if b == nil {
		return ""
	}

	newBool := *b
	return fmt.Sprintf("%t", newBool)
}

// convert int to string
func IntToString(i *int64) string {
	if i == nil {
		return ""
	}

	newInt := *i
	return fmt.Sprintf("%d", newInt)
}

// convert float64 to string
func Float64ToString(f *float64) string {
	if f == nil {
		return ""
	}

	newFloat := *f
	return fmt.Sprintf("%f", newFloat)
}

// normalize phone number
func NormalizePhoneNumber(phoneNumber string) (string, error) {
	if len(phoneNumber) < 10 {
		return phoneNumber, errors.New("InvalidPhoneNumber")
	}

	return fmt.Sprintf("233%s", phoneNumber[len(phoneNumber)-9:]), nil
}

func GetStringPointer(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func GetInt64Pointer(i int64) *int64 {
	if i == 0 {
		return nil
	}
	return &i
}

func GetBoolPointer(b bool) *bool {
	if !b {
		return nil
	}
	return &b
}

func GetFloat64Pointer(f float64) *float64 {
	if f == 0 {
		return nil
	}
	return &f
}

func ConvertStringToFloat64(s string) (float64, error) {
	var f float64
	_, err := fmt.Sscanf(s, "%f", &f)
	if err != nil {
		return 0, fmt.Errorf("failed to convert string to float64: %w", err)
	}
	return f, nil
}

func ConvertStringToInt64(s string) (int64, error) {
	var i int64
	_, err := fmt.Sscanf(s, "%d", &i)
	if err != nil {
		return 0, fmt.Errorf("failed to convert string to int64: %w", err)
	}
	return i, nil
}
