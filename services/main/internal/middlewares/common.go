package middlewares

import (
	"errors"
	"strings"
)

func ExtractToken(unattendedToken string) (string, error) {
	// remove bearer
	strArr := strings.Split(unattendedToken, " ")
	if len(strArr) != 2 {
		return "", errors.New("AuthorizationFailed")
	}
	return strArr[1], nil
}
