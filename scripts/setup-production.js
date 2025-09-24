#!/usr/bin/env node

/**
 * FITGENIUS - PRODUCTION SETUP SCRIPT
 * Automates production environment configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log('🚀 FitGenius Production Setup\n');

// Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function generateJWT() {
  return crypto.randomBytes(64).toString('hex');
}

// Step 1: Check requirements
log('📋 Checking requirements...', 'blue');

const requiredFiles = ['.env.example', 'package.json', 'prisma/schema.prisma'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  log(`❌ Missing required files: ${missingFiles.join(', ')}`, 'red');
  process.exit(1);
}

log('✅ All required files present', 'green');

// Step 2: Generate production environment file
log('\n🔧 Generating production environment...', 'blue');

const secrets = {
  NEXTAUTH_SECRET: generateSecret(),
  JWT_SECRET: generateJWT(),
  REFRESH_TOKEN_SECRET: generateJWT(),
  VAPID_PUBLIC_KEY: 'GENERATE_VAPID_KEYS',
  VAPID_PRIVATE_KEY: 'GENERATE_VAPID_KEYS'
};

let envProduction = fs.readFileSync('.env.production', 'utf8');

// Replace placeholder secrets
Object.keys(secrets).forEach(key => {
  const placeholder = envProduction.match(new RegExp(`${key}=".*"`));
  if (placeholder) {
    envProduction = envProduction.replace(
      placeholder[0],
      `${key}="${secrets[key]}"`
    );
  }
});

// Create backup and write new file
if (fs.existsSync('.env.production.backup')) {
  fs.unlinkSync('.env.production.backup');
}
fs.copyFileSync('.env.production', '.env.production.backup');
fs.writeFileSync('.env.production', envProduction);

log('✅ Production environment updated with secure secrets', 'green');

// Step 3: Verify dependencies
log('\n📦 Verifying production dependencies...', 'blue');

try {
  execSync('npm audit --audit-level=high', { stdio: 'inherit' });
  log('✅ Security audit passed', 'green');
} catch (error) {
  log('⚠️ Security vulnerabilities found - please review', 'yellow');
}

// Step 4: Database setup instructions
log('\n🗄️ Database Setup Required:', 'cyan');
log('1. Create production database (Supabase/Neon recommended)');
log('2. Update DATABASE_URL in .env.production');
log('3. Run: npx prisma migrate deploy');
log('4. Run: npx prisma generate');

// Step 5: Payment setup instructions
log('\n💳 Stripe Setup Required:', 'cyan');
log('1. Create Stripe account and get LIVE keys');
log('2. Create products and copy price IDs');
log('3. Configure webhook endpoint: /api/stripe/webhook');
log('4. Update STRIPE_* variables in .env.production');

// Step 6: Domain setup
log('\n🌐 Domain Setup Required:', 'cyan');
log('1. Configure DNS for your domain');
log('2. Update NEXTAUTH_URL and NEXT_PUBLIC_APP_URL');
log('3. Set up SSL certificate (automatic with Vercel)');

// Step 7: Generate deployment checklist
const checklist = `
# 🚀 FITGENIUS DEPLOYMENT CHECKLIST

## Pre-Deploy ✅
- [ ] Database configured and migrated
- [ ] All environment variables set
- [ ] Stripe configured with live keys
- [ ] Domain DNS configured
- [ ] SSL certificate active

## Deploy Steps ✅
- [ ] Run: npm run build (locally to test)
- [ ] Push to GitHub repository
- [ ] Deploy via Vercel/Railway/Render
- [ ] Configure environment variables on platform
- [ ] Run database migrations in production

## Post-Deploy Testing ✅
- [ ] Health check: /health endpoint
- [ ] User registration works
- [ ] Login/authentication works
- [ ] Payment flow works (test mode first)
- [ ] Email sending works
- [ ] PWA installs correctly
- [ ] Mobile app connects to API
- [ ] Webhooks receive events

## Production Monitoring ✅
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up backup schedule
- [ ] Monitor performance metrics
- [ ] Set up alerts for critical issues

## Launch Preparation ✅
- [ ] Legal pages (Terms, Privacy)
- [ ] Support documentation
- [ ] User onboarding flow
- [ ] Marketing materials
- [ ] Social media accounts

Generated: ${new Date().toISOString()}
`;

fs.writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);

// Step 8: Create quick deploy script
const quickDeploy = `#!/bin/bash
echo "🚀 Quick Deploy - FitGenius"
npm run build
git add .
git commit -m "deploy: production update $(date)"
git push origin master
echo "✅ Pushed to GitHub - Vercel will auto-deploy"
`;

fs.writeFileSync('scripts/quick-deploy.sh', quickDeploy);
fs.chmodSync('scripts/quick-deploy.sh', '755');

// Final instructions
log('\n🎉 Production setup completed!', 'green');
log('\n📁 Files created:', 'blue');
log('   • .env.production (updated with secrets)');
log('   • .env.production.backup (original backup)');
log('   • DEPLOYMENT_CHECKLIST.md');
log('   • scripts/quick-deploy.sh');

log('\n🔐 Generated secure secrets for:', 'cyan');
Object.keys(secrets).forEach(key => {
  if (!secrets[key].includes('GENERATE')) {
    log(`   • ${key}`);
  }
});

log('\n📋 Next Steps:', 'yellow');
log('1. Review and update .env.production with your actual values');
log('2. Follow DEPLOYMENT_CHECKLIST.md');
log('3. Run ./scripts/deploy.sh when ready');

log('\n🌟 Your FitGenius is ready for production!', 'green');

process.exit(0);