.PHONY: build run test lint clean migrate-up migrate-down migrate-create swagger

# Build the application
build:
	go build -o bin/server ./cmd/server

# Run the application
run:
	go run ./cmd/server

# Run tests
test:
	go test ./... -cover

# Run tests with verbose output
test-verbose:
	go test ./... -v -cover

# Run linter
lint:
	golangci-lint run

# Run linter with fix
lint-fix:
	golangci-lint run --fix

# Clean build artifacts
clean:
	rm -rf bin/

# Database migrations
migrate-up:
	migrate -path migrations -database "postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)" up

migrate-down:
	migrate -path migrations -database "postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)" down

migrate-create:
	@read -p "Enter migration name: " name; \
	migrate create -ext sql -dir migrations -seq $$name

# Generate swagger documentation
swagger:
	swag init -g cmd/server/main.go -o internal/docs

# Install dependencies
deps:
	go mod download
	go mod tidy

# Development setup
setup: deps
	cp .env.example .env
	@echo "Please edit .env with your configuration"