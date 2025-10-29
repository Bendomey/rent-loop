package services

type PropertyService interface{}

type CreatePropertyInput struct {
	Type        string
	Status      string
	Name        string
	Slug        string
	Description *string
	Images      *[]string
	Tags        *[]string
	Latitude    float64
	Longitude   float64
	Address     string
	Country     string
	Region      string
	City        string
	GpsAddress  *string
	ClientID    string
	CreatedByID string
}
