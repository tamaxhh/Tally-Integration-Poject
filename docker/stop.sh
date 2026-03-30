#!/bin/bash

# Docker stop script for Tally Integration
# Usage: ./stop.sh [dev|prod|all]

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

# Stop development environment
stop_dev() {
    print_status "Stopping development environment..."
    
    if docker-compose -f docker-compose.dev.yml ps -q | grep -q .; then
        docker-compose -f docker-compose.dev.yml down
        print_success "Development environment stopped"
    else
        print_warning "No development services are running"
    fi
}

# Stop production environment
stop_prod() {
    print_status "Stopping production environment..."
    
    if docker-compose -f docker-compose.prod.yml ps -q | grep -q .; then
        docker-compose -f docker-compose.prod.yml down
        print_success "Production environment stopped"
    else
        print_warning "No production services are running"
    fi
}

# Stop all environments
stop_all() {
    print_status "Stopping all environments..."
    
    # Stop development
    if docker-compose -f docker-compose.dev.yml ps -q | grep -q .; then
        docker-compose -f docker-compose.dev.yml down
        print_success "Development environment stopped"
    fi
    
    # Stop production
    if docker-compose -f docker-compose.prod.yml ps -q | grep -q .; then
        docker-compose -f docker-compose.prod.yml down
        print_success "Production environment stopped"
    fi
    
    # Stop basic services
    if docker-compose ps -q | grep -q .; then
        docker-compose down
        print_success "Basic services stopped"
    else
        print_warning "No basic services are running"
    fi
}

# Clean up resources
cleanup() {
    print_status "Cleaning up Docker resources..."
    
    # Remove stopped containers
    if docker ps -a -q --filter "name=tally" | grep -q .; then
        docker rm $(docker ps -a -q --filter "name=tally") 2>/dev/null || true
        print_success "Removed stopped containers"
    fi
    
    # Remove unused images
    if docker images -q --filter "reference=tally*" | grep -q .; then
        docker rmi $(docker images -q --filter "reference=tally*") 2>/dev/null || true
        print_success "Removed unused images"
    fi
    
    # Clean up volumes (optional)
    read -p "Do you want to remove all Docker volumes? This will delete all data! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume prune -f
        print_success "Removed unused volumes"
    else
        print_warning "Volumes preserved"
    fi
    
    # Clean up networks
    docker network prune -f
    print_success "Cleaned up networks"
}

# Show status
show_status() {
    print_status "Current Docker status:"
    echo ""
    
    echo "🐳 Containers:"
    docker ps --filter "name=tally" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "No tally containers running"
    echo ""
    
    echo "📦 Images:"
    docker images --filter "reference=tally*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" || echo "No tally images found"
    echo ""
    
    echo "🗂️  Volumes:"
    docker volume ls --filter "name=tally" --format "table {{.Name}}\t{{.Driver}}" || echo "No tally volumes found"
    echo ""
    
    echo "🌐 Networks:"
    docker network ls --filter "name=tally" --format "table {{.Name}}\t{{.Driver}}" || echo "No tally networks found"
}

# Main script
main() {
    echo "🛑 Tally Integration Docker Stop Script"
    echo "======================================"
    
    # Environment argument
    ENV=${1:-all}
    
    case $ENV in
        "dev"|"development")
            stop_dev
            ;;
        "prod"|"production")
            stop_prod
            ;;
        "all"|"")
            stop_all
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            stop_all
            cleanup
            ;;
        *)
            print_error "Invalid option. Use 'dev', 'prod', 'all', 'status', or 'cleanup'"
            echo "Usage: $0 [dev|prod|all|status|cleanup]"
            exit 1
            ;;
    esac
    
    if [ "$ENV" != "status" ]; then
        echo ""
        print_success "Operation completed!"
        echo ""
        echo "Additional commands:"
        echo "  📊 Show status:    $0 status"
        echo "  🧹 Full cleanup:  $0 cleanup"
        echo "  🚀 Start dev:     ./start.sh dev"
        echo "  🚀 Start prod:    ./start.sh prod"
    fi
}

# Run main function with all arguments
main "$@"
