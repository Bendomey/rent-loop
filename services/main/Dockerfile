FROM golang:1.24 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/build/main ./cmd/rentloop-engine/main.go

# Final stage
FROM alpine:latest

ENV PORT=8080

WORKDIR /root/

COPY --from=builder /app/build/main .

CMD ["./main"]
EXPOSE 8080