package lib

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"

	"github.com/gofrs/uuid"
)

// ErrMalformedRefreshToken covers every shape problem with a presented token:
// no separator, empty half, or an id half that isn't a UUID. Callers must map
// all of these to the same opaque 401 as a missing or mismatched token — the
// client learns only "invalid", never which check failed.
var ErrMalformedRefreshToken = errors.New("MalformedRefreshToken")

const refreshTokenSecretBytes = 32

// GenerateRefreshTokenSecret returns the secret half of a refresh token:
// 32 bytes of crypto-random data, base64url-encoded without padding.
func GenerateRefreshTokenSecret() (string, error) {
	buf := make([]byte, refreshTokenSecretBytes)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

// HashRefreshTokenSecret returns the hex-encoded SHA-256 of the secret. Only
// this digest is ever persisted — never the secret itself.
func HashRefreshTokenSecret(secret string) string {
	sum := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(sum[:])
}

// ComposeRefreshToken builds the string handed to the client. The id prefix
// lets the server find the row by primary key instead of scanning hashes.
func ComposeRefreshToken(id string, secret string) string {
	return id + ":" + secret
}

// ParseRefreshToken splits a presented token back into its id and secret
// halves. The id is validated as a UUID here so a junk id never reaches
// Postgres, where comparing a non-UUID against a uuid column raises a
// database error rather than returning no rows.
func ParseRefreshToken(token string) (string, string, error) {
	id, secret, found := strings.Cut(token, ":")
	if !found || id == "" || secret == "" {
		return "", "", ErrMalformedRefreshToken
	}
	if _, err := uuid.FromString(id); err != nil {
		return "", "", ErrMalformedRefreshToken
	}
	return id, secret, nil
}

// RefreshTokenSecretMatches compares a presented secret against a stored
// digest in constant time, so response timing cannot be used to brute-force
// the secret one byte at a time.
func RefreshTokenSecretMatches(secret string, storedHash string) bool {
	computed := HashRefreshTokenSecret(secret)
	return subtle.ConstantTimeCompare([]byte(computed), []byte(storedHash)) == 1
}
