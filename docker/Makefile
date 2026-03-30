# Makefile for Docker operations

.PHONY: help build up down logs clean rebuild dev prod health

# Default target
help:
	@echo "Available commands:"
	@echo "  make build     - Build all Docker images"
	@echo "  make up        - Start production environment"
	@echo "  make dev       - Start development environment"
	@echo "  make down      - Stop all services"
	@echo "  make logs      - Show logs for all services"
	@echo "  make logs-be   - Show backend logs"
	@echo "  make logs-fe   - Show frontend logs"
	@echo "  make clean     - Remove containers and images"
	@echo "  make rebuild   - Rebuild and restart all services"
	@echo "  make health    - Check health of all services"
	@echo "  make shell-be  - Open shell in backend container"
	@echo "  make shell-db  - Open PostgreSQL shell"

# Build all Docker images
build:
	@echo "Building Docker images..."
	docker-compose build

# Start production environment
up: build
	@echo "Starting production environment..."
	docker-compose up -d
	@echo "Services started:"
	@echo "  Frontend: http://localhost"
	@echo "  Backend:  http://localhost:3000"

# Start development environment
dev: build
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Services started:"
	@echo "  Frontend (dev): http://localhost:3001"
	@echo "  Backend:       http://localhost:3000"

# Stop all services
down:
	@echo "Stopping all services..."
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

# Show logs for all services
logs:
	docker-compose logs -f

# Show backend logs
logs-be:
	docker-compose logs -f backend

# Show frontend logs
logs-fe:
	docker-compose logs -f frontend

# Clean up containers and images
clean: down
	@echo "Removing containers and images..."
	docker-compose down --rmi all --volumes --remove-orphans
	docker-compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans
	docker system prune -f

# Rebuild and restart all services
rebuild: clean up

# Check health of all services
health:
	@echo "Checking service health..."
	@docker-compose ps

# Open shell in backend container
shell-be:
	@echo "Opening shell in backend container..."
	docker exec -it tally-backend sh

# Open PostgreSQL shell
shell-db:
	@echo "Opening PostgreSQL shell..."
	docker exec -it tally-postgres psql -U postgres -d tally_integration

# Quick development setup
quick-start: dev
	@echo "Waiting for services to be ready..."
	@sleep 10
	@make health
	@echo "Development environment is ready!"
	@echo "Frontend: http://localhost:3001"
	@echo "Backend:  http://localhost:3000"
