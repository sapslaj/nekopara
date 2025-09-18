# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY main.go .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o traefik-failover .

# Final stage
FROM debian:trixie-slim

# Install ca-certificates for TLS connections
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --system --create-home --shell /bin/false traefik-failover

# Copy binary from builder stage
COPY --from=builder /app/traefik-failover /usr/local/bin/traefik-failover

# Switch to non-root user
USER traefik-failover

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/traefik-failover"]
