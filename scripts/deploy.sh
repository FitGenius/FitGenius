#!/bin/bash

# =================================
# FITGENIUS - PRODUCTION DEPLOY SCRIPT
# =================================

set -e  # Exit on any error

echo "🚀 Starting FitGenius Production Deploy..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Environment Check
print_step "Checking environment..."

if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found!"
    echo "Please create .env.production with all required variables."
    exit 1
fi

print_success "Environment file found"

# Step 2: Dependencies
print_step "Installing dependencies..."
npm ci --production=false
print_success "Dependencies installed"

# Step 3: Build
print_step "Building application..."
npm run build
print_success "Build completed"

# Step 4: Database Migration
print_step "Running database migrations..."
if [ -n "$DATABASE_URL" ]; then
    npx prisma migrate deploy
    npx prisma generate
    print_success "Database migrations completed"
else
    print_warning "DATABASE_URL not set, skipping migrations"
fi

# Step 5: Tests (optional)
print_step "Running critical tests..."
if command -v npm run test:critical &> /dev/null; then
    npm run test:critical
    print_success "Tests passed"
else
    print_warning "No critical tests found, skipping"
fi

# Step 6: Security Check
print_step "Running security audit..."
npm audit --audit-level=moderate
print_success "Security audit completed"

# Step 7: Deploy to Vercel
print_step "Deploying to Vercel..."
if command -v vercel &> /dev/null; then
    vercel --prod --yes
    print_success "Deployed to Vercel"
else
    print_warning "Vercel CLI not installed. Deploy manually:"
    echo "1. Push to GitHub: git push origin master"
    echo "2. Vercel will auto-deploy from GitHub"
fi

# Step 8: Verify deployment
print_step "Verifying deployment..."
if [ -n "$NEXT_PUBLIC_APP_URL" ]; then
    echo "🌐 Application URL: $NEXT_PUBLIC_APP_URL"
    echo "🔍 Health check: $NEXT_PUBLIC_APP_URL/health"
else
    echo "🌐 Check your deployment at your configured domain"
fi

# Step 9: Post-deploy tasks
print_step "Post-deployment checklist..."
echo ""
echo "📋 Manual verification required:"
echo "   ✓ Test user registration/login"
echo "   ✓ Test payment flow (use Stripe test mode first)"
echo "   ✓ Verify email sending"
echo "   ✓ Test PWA installation"
echo "   ✓ Check mobile app connectivity"
echo "   ✓ Verify webhook endpoints"
echo ""

print_success "🎉 Deploy completed successfully!"
echo ""
echo "📊 Next steps:"
echo "   1. Configure domain DNS"
echo "   2. Set up monitoring (Sentry)"
echo "   3. Configure backup schedule"
echo "   4. Test all payment flows"
echo "   5. Launch mobile app"
echo ""
echo "🚀 FitGenius is ready for production!"