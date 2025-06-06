# Build stage
FROM golang:1.23-alpine AS builder

# Set working directory
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o main ./internal

# Final stage
FROM alpine:3.19

# Set working directory
WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/main .

EXPOSE 8000

CMD ["./main"] 