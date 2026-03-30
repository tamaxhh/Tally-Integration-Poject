#!/bin/bash

# Docker startup script for Tally Integration
# Usage: ./start.sh [dev|prod]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed. Please install it first."
        exit 1
    fi
    print_success "docker-compose is available"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p logs
    mkdir -p ssl
    mkdir -p backups
    print_success "Directories created"
}

# Set up environment file
setup_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp ../.env.example .env
        print_warning "Please edit .env file with your configuration before running again."
        exit 1
    fi
    print_success "Environment file found"
}

# Start development environment
start_dev() {
    print_status "Starting development environment..."
    
    # Check if Tally is accessible (optional)
    if nc -z localhost 9000 2>/dev/null; then
        print_success "Tally ERP is accessible on port 9000"
    else
        print_warning "Tally ERP is not accessible on port 9000. Make sure Tally is running with ODBC enabled."
    fi
    
    # Start services
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 15
    
    # Check health
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up (healthy)"; then
        print_success "Development environment started successfully!"
        echo ""
        echo "Services are available at:"
        echo "  🌐 Frontend (dev): http://localhost:3001"
        echo "  🔧 Backend API:    http://localhost:3000"
        echo "  🗄️  PostgreSQL:    localhost:5432"
        echo "  📦 Redis:          localhost:6379"
        echo ""
        echo "Useful commands:"
        echo "  📋 View logs:      docker-compose -f docker-compose.dev.yml logs -f"
        echo "  🛠️  Backend shell: docker exec -it tally-backend-dev sh"
        echo "  🗄️  DB shell:       docker exec -it tally-postgres-dev psql -U postgres -d tally_integration"
        echo "  🛑 Stop all:       docker-compose -f docker-compose.dev.yml down"
    else
        print_error "Some services failed to start. Check logs:"
        docker-compose -f docker-compose.dev.yml ps
        exit 1
    fi
}

# Start production environment
start_prod() {
    print_status "Starting production environment..."
    
    # Check for production requirements
    if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
        print_warning "SSL certificates not found in ssl/ directory. HTTP will be used."
    fi
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 20
    
    # Check health
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up (healthy)"; then
        print_success "Production environment started successfully!"
        echo ""
        echo "Services are available at:"
        echo "  🌐 Frontend:       http://localhost"
        echo "  🔧 Backend API:    http://localhost:3000"
        echo "  🗄️  PostgreSQL:    localhost:5432"
        echo "  📦 Redis:          localhost:6379"
        echo "  📊 Monitoring:    http://localhost:9090 (if enabled)"
        echo ""
        echo "Useful commands:"
        echo "  📋 View logs:      docker-compose -f docker-compose.prod.yml logs -f"
        echo "  🛠️  Backend shell: docker exec -it tally-backend-prod sh"
        echo "  🗄️  DB shell:       docker exec -it tally-postgres-prod psql -U postgres -d tally_integration"
        echo "  🛑 Stop all:       docker-compose -f docker-compose.prod.yml down"
    else
        print_error "Some services failed to start. Check logs:"
        docker-compose -f docker-compose.prod.yml ps
        exit 1
    fi
}

# Main script
main() {
    echo "🚀 Tally Integration Docker Setup"
    echo "=================================="
    
    # Environment argument
    ENV=${1:-dev}
    
    case $ENV in
        "dev"|"development")
            print_status "Setting up development environment..."
            check_docker
            check_docker_compose
            create_directories
            setup_env
            start_dev
            ;;
        "prod"|"production")
            print_status "Setting up production environment..."
            check_docker
            check_docker_compose
            create_directories
            setup_env
            start_prod
            ;;
        *)
            print_error "Invalid environment. Use 'dev' or 'prod'"
            echo "Usage: $0 [dev|prod]"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
