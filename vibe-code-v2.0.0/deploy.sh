#!/bin/bash
# Vibe Code - Production Deployment Script
# Run this script to deploy Vibe Code to production

set -e  # Exit on error

# Colors for output
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print with color
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
╦  ╦╦╔╗ ╔═╗  ╔═╗╔═╗╔╦╗╔═╗
╚╗╔╝║╠╩╗║╣───║  ║ ║ ║║║╣
 ╚╝ ╩╚═╝╚═╝  ╚═╝╚═╝═╩╝╚═╝
      Production Deployment
EOF
echo -e "${NC}"

# Step 1: Pre-flight checks
print_info "Running pre-flight checks..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_info "Please edit .env file and add your API keys before continuing."
        exit 1
    else
        print_error ".env.example not found. Cannot create .env file."
        exit 1
    fi
fi

# Check if at least one API key is set
if ! grep -q "ANTHROPIC_API_KEY=sk-" .env && \
   ! grep -q "OPENAI_API_KEY=sk-" .env && \
   ! grep -q "GOOGLE_API_KEY=" .env; then
    print_error "No API keys found in .env file. Please add at least one AI model API key."
    exit 1
fi

print_success "Pre-flight checks passed!"

# Step 2: Run tests
print_info "Running tests..."
if npm test; then
    print_success "Tests passed!"
else
    print_error "Tests failed. Please fix failing tests before deploying."
    exit 1
fi

# Step 3: Build Docker image
print_info "Building Docker image..."
if docker build -t vibe-code:latest .; then
    print_success "Docker image built successfully!"
else
    print_error "Docker build failed."
    exit 1
fi

# Step 4: Stop existing containers
print_info "Stopping existing containers..."
docker-compose down || true

# Step 5: Start new containers
print_info "Starting containers..."
if docker-compose up -d; then
    print_success "Containers started successfully!"
else
    print_error "Failed to start containers."
    exit 1
fi

# Step 6: Wait for health check
print_info "Waiting for application to be healthy..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Application is healthy!"
        break
    fi

    attempt=$((attempt + 1))
    echo -n "."
    sleep 2

    if [ $attempt -eq $max_attempts ]; then
        print_error "Application failed to become healthy."
        print_info "Check logs with: docker-compose logs"
        exit 1
    fi
done

# Step 7: Show logs
print_info "Recent logs:"
docker-compose logs --tail=20

# Step 8: Success!
echo ""
print_success "======================================"
print_success "🎉 Deployment successful!"
print_success "======================================"
echo ""
print_info "Application is running at: http://localhost:3000"
print_info ""
print_info "Useful commands:"
print_info "  - View logs:    docker-compose logs -f"
print_info "  - Stop:         docker-compose down"
print_info "  - Restart:      docker-compose restart"
print_info "  - Shell access: docker-compose exec vibe-code sh"
echo ""
