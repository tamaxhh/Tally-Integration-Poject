#!/bin/bash

# Docker Run Script for Tally Integration Project
# =========================================
# This script provides easy commands to run the Docker stack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Help function
show_help() {
    echo "Tally Integration Docker Commands:"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  up         Start all services (app, redis, postgres)"
    echo "  down       Stop all services"
    echo "  restart    Restart all services"
    echo "  logs       Show logs for all services"
    echo "  app-logs  Show logs only for the app"
    echo "  status     Show status of all services"
    echo "  clean      Remove all containers, networks, and volumes"
    echo "  migrate    Run database migrations"
    echo "  dev-tools  Start with Redis Commander (cache UI)"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 up                    # Start all services"
    echo "  $0 dev-tools up          # Start with Redis Commander"
    echo "  $0 logs                 # Follow all logs"
    echo "  $0 migrate               # Run database migrations"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Change to project root directory
cd "$(dirname "$0")/.."

print_header "Tally Integration Docker Stack"

# Main command handling
case "${1:-help}" in
    "up")
        print_status "Starting all services..."
        check_docker
        docker-compose -f docker/docker-compose.yml up -d
        print_status "Services started!"
        echo ""
        echo "🌐 API Server: http://localhost:3000"
        echo "🗄️  PostgreSQL: localhost:5433"
        echo "🔴 Redis: localhost:6379"
        echo ""
        echo "Run '$0 logs' to follow logs"
        ;;
    
    "down")
        print_status "Stopping all services..."
        docker-compose -f docker/docker-compose.yml down
        print_status "Services stopped!"
        ;;
    
    "restart")
        print_status "Restarting all services..."
        docker-compose -f docker/docker-compose.yml restart
        print_status "Services restarted!"
        ;;
    
    "logs")
        print_status "Following logs for all services..."
        docker-compose -f docker/docker-compose.yml logs -f
        ;;
    
    "app-logs")
        print_status "Following logs for app service..."
        docker-compose -f docker/docker-compose.yml logs -f app
        ;;
    
    "status")
        print_status "Service status:"
        docker-compose -f docker/docker-compose.yml ps
        ;;
    
    "clean")
        print_warning "This will remove ALL containers, networks, and volumes!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Removing everything..."
            docker-compose -f docker/docker-compose.yml down -v --remove-orphans
            docker system prune -f
            print_status "Cleanup complete!"
        else
            print_status "Cleanup cancelled."
        fi
        ;;
    
    "migrate")
        print_status "Running database migrations..."
        docker-compose -f docker/docker-compose.yml exec app node src/db/migrate.js up
        ;;
    
    "dev-tools")
        print_status "Starting services with development tools..."
        check_docker
        docker-compose -f docker/docker-compose.yml --profile dev-tools up -d
        print_status "Services started with dev tools!"
        echo ""
        echo "🌐 API Server: http://localhost:3000"
        echo "🗄️  PostgreSQL: localhost:5433"
        echo "🔴 Redis: localhost:6379"
        echo "🛠️  Redis Commander: http://localhost:8081"
        ;;
    
    "help"|*)
        show_help
        ;;
esac
