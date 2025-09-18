FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o cnpg-pgdump .

FROM alpine:latest

RUN apk add --no-cache postgresql-client

WORKDIR /app
COPY --from=builder /app/cnpg-pgdump .

RUN mkdir -p /backups

ENTRYPOINT ["./cnpg-pgdump"]