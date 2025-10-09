package lib

import (
	"encoding/json"
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

func InterfaceToJSON(input map[string]interface{}) (*datatypes.JSON, error) {
	var jsonData datatypes.JSON
	bytes, err := json.Marshal(input)
	if err != nil {
		return &jsonData, err
	}

	err = json.Unmarshal(bytes, &jsonData)
	return &jsonData, err
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
