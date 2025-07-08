#!/bin/bash

# Production Deployment Script for Early Autism Detector
# This script validates, builds, and deploys the application to production

set -e  # Exit on any error

echo "🚀 Starting production deployment for Early Autism Detector..."
echo "=================================================="

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Step 1: Validate environment variables
print_status "Step 1: Validating environment variables..."
if [ -f "scripts/validate-production-env.js" ]; then
    node scripts/validate-production-env.js
    if [ $? -ne 0 ]; then
        print_error "Environment validation failed. Please fix the issues above."
        exit 1
    fi
    print_success "Environment validation passed"
else
    print_warning "Environment validation script not found. Skipping..."
fi

# Step 2: Install dependencies
print_status "Step 2: Installing dependencies..."
npm ci --production=false
print_success "Dependencies installed"

# Step 3: Type checking
print_status "Step 3: Running TypeScript type checking..."
npm run type-check
if [ $? -ne 0 ]; then
    print_error "TypeScript type checking failed. Please fix the errors."
    exit 1
fi
print_success "Type checking passed"

# Step 4: Linting
print_status "Step 4: Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    print_error "Linting failed. Please fix the errors."
    exit 1
fi
print_success "Linting passed"

# Step 5: Build the application
print_status "Step 5: Building the application..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed. Please check the errors above."
    exit 1
fi
print_success "Build completed successfully"

# Step 6: Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing globally..."
    npm install -g vercel
fi

# Step 7: Deploy to Vercel
print_status "Step 7: Deploying to Vercel..."
print_warning "This will deploy to production. Make sure you're ready!"
read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod
    if [ $? -eq 0 ]; then
        print_success "Deployment completed successfully!"
        echo ""
        echo "🎉 Your Early Autism Detector app is now live in production!"
        echo ""
        echo "Next steps:"
        echo "1. Test the production deployment thoroughly"
        echo "2. Monitor error rates and performance"
        echo "3. Set up monitoring alerts"
        echo "4. Update documentation with production URL"
    else
        print_error "Deployment failed. Please check the Vercel logs."
        exit 1
    fi
else
    print_warning "Deployment cancelled by user."
    echo "Your build is ready for deployment. Run 'vercel --prod' when ready."
fi

echo ""
echo "=================================================="
print_success "Production deployment script completed!"
echo "=================================================="
