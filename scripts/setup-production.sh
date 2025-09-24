#!/bin/bash
# =================
# FITGENIUS - PRODUCTION SETUP SCRIPT
# =================

set -e

echo "🚀 Setting up FitGenius for Production..."

# Colors
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
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if required tools are installed
print_step "Checking required tools..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm"
    exit 1
fi

if ! command -v git &> /dev/null; then
    print_error "git is not installed. Please install git"
    exit 1
fi

print_status "All required tools are installed ✓"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current: $(node --version)"
    exit 1
fi

print_status "Node.js version: $(node --version) ✓"

# Install dependencies
print_step "Installing dependencies..."
npm ci --production

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found. Creating template..."
    cp .env.example .env.production
    print_warning "Please configure .env.production with your production values"
fi

# Build the application
print_step "Building application for production..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    print_status "Build completed successfully ✓"
else
    print_error "Build failed. Please check the errors above."
    exit 1
fi

# Database setup
print_step "Setting up database..."
if [ -z "$DATABASE_URL" ]; then
    print_warning "DATABASE_URL not set. Skipping database migration."
else
    print_status "Running database migrations..."
    npx prisma migrate deploy

    print_status "Generating Prisma client..."
    npx prisma generate
fi

# Security check
print_step "Running security checks..."
npm audit --production

# Performance check
print_step "Checking bundle size..."
npm run analyze 2>/dev/null || print_warning "Bundle analysis not available"

# Generate secrets if needed
print_step "Checking security configuration..."
if grep -q "GENERATE_A_SECURE_SECRET" .env.production; then
    print_warning "Please generate a secure NEXTAUTH_SECRET:"
    echo "openssl rand -base64 32"
fi

# Final checks
print_step "Running final checks..."

# Check if critical environment variables are set
CRITICAL_VARS=("DATABASE_URL" "NEXTAUTH_URL" "NEXTAUTH_SECRET")
for var in "${CRITICAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        print_warning "$var is not set in environment"
    else
        print_status "$var is configured ✓"
    fi
done

# Print deployment instructions
echo ""
echo "🎉 Production setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your production database (Supabase/Neon)"
echo "2. Set up your deployment platform (Vercel/Railway/Render)"
echo "3. Configure your domain and SSL"
echo "4. Set up monitoring (Sentry)"
echo "5. Configure payment providers (Stripe/MercadoPago)"
echo ""
echo "Deployment commands:"
echo "- Vercel: vercel --prod"
echo "- Docker: docker build -t fitgenius ."
echo "- Manual: npm start"
echo ""

print_status "Ready for deployment! 🚀"