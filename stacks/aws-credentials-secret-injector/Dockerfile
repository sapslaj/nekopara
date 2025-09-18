# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY main.go .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o aws-credentials-secret-injector .

# Final stage
FROM debian:trixie-slim

# Install ca-certificates for TLS connections
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --system --create-home --shell /bin/false aws-credentials-secret-injector

# Copy binary from builder stage
COPY --from=builder /app/aws-credentials-secret-injector /usr/local/bin/aws-credentials-secret-injector

# Switch to non-root user
USER aws-credentials-secret-injector

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/aws-credentials-secret-injector"]
