#!/usr/bin/env node

/**
 * FITGENIUS - PRODUCTION TESTING SCRIPT
 * Comprehensive production environment testing
 */

const https = require('https');
const { execSync } = require('child_process');

console.log('🧪 FitGenius Production Testing Suite\n');

// Colors
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

// Configuration
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fitgenius.app';
const API_URL = `${APP_URL}/api`;

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Helper functions
async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function addResult(name, status, message = '', details = '') {
  results.tests.push({ name, status, message, details });

  if (status === 'PASS') {
    results.passed++;
    log(`✅ ${name}${message ? ': ' + message : ''}`, 'green');
  } else if (status === 'FAIL') {
    results.failed++;
    log(`❌ ${name}: ${message}`, 'red');
    if (details) log(`   ${details}`, 'yellow');
  } else if (status === 'WARN') {
    results.warnings++;
    log(`⚠️ ${name}: ${message}`, 'yellow');
  }
}

// Test suites
async function testHealthCheck() {
  log('\n🏥 Health Check Tests', 'blue');

  try {
    const response = await makeRequest(`${API_URL}/health`);

    if (response.statusCode === 200) {
      addResult('Health endpoint', 'PASS', 'API is responsive');
    } else {
      addResult('Health endpoint', 'FAIL', `Status: ${response.statusCode}`);
    }
  } catch (error) {
    addResult('Health endpoint', 'FAIL', error.message);
  }
}

async function testSecurityHeaders() {
  log('\n🔐 Security Headers Tests', 'blue');

  try {
    const response = await makeRequest(APP_URL);
    const headers = response.headers;

    // Check security headers
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy'
    ];

    securityHeaders.forEach(header => {
      if (headers[header]) {
        addResult(`Security header: ${header}`, 'PASS');
      } else {
        addResult(`Security header: ${header}`, 'WARN', 'Header missing');
      }
    });

    // Check HTTPS redirect
    if (response.headers['strict-transport-security']) {
      addResult('HTTPS enforcement', 'PASS', 'HSTS header present');
    } else {
      addResult('HTTPS enforcement', 'WARN', 'HSTS header missing');
    }

  } catch (error) {
    addResult('Security headers', 'FAIL', error.message);
  }
}

async function testDatabaseConnection() {
  log('\n🗄️ Database Connection Tests', 'blue');

  // This would require a health endpoint that checks DB
  try {
    const response = await makeRequest(`${API_URL}/health/database`);

    if (response.statusCode === 200) {
      addResult('Database connection', 'PASS', 'Database is reachable');
    } else {
      addResult('Database connection', 'FAIL', `Status: ${response.statusCode}`);
    }
  } catch (error) {
    addResult('Database connection', 'WARN', 'Health endpoint not available');
  }
}

async function testAuthEndpoints() {
  log('\n🔑 Authentication Tests', 'blue');

  // Test auth API availability
  try {
    const response = await makeRequest(`${API_URL}/auth/providers`);

    if (response.statusCode === 200) {
      addResult('Auth providers endpoint', 'PASS');
    } else {
      addResult('Auth providers endpoint', 'FAIL', `Status: ${response.statusCode}`);
    }
  } catch (error) {
    addResult('Auth providers endpoint', 'FAIL', error.message);
  }
}

async function testStripeIntegration() {
  log('\n💳 Stripe Integration Tests', 'blue');

  // Test plans endpoint
  try {
    const response = await makeRequest(`${API_URL}/plans`);

    if (response.statusCode === 200) {
      addResult('Stripe plans endpoint', 'PASS');

      // Check if plans are properly configured
      try {
        const plans = JSON.parse(response.data);
        if (plans.plans && plans.plans.length > 0) {
          addResult('Stripe plans data', 'PASS', `${plans.plans.length} plans available`);
        } else {
          addResult('Stripe plans data', 'WARN', 'No plans found');
        }
      } catch {
        addResult('Stripe plans parsing', 'WARN', 'Could not parse response');
      }
    } else {
      addResult('Stripe plans endpoint', 'FAIL', `Status: ${response.statusCode}`);
    }
  } catch (error) {
    addResult('Stripe plans endpoint', 'FAIL', error.message);
  }

  // Test webhook endpoint (should return 400 without proper signature)
  try {
    const response = await makeRequest(`${API_URL}/stripe/webhook`, {
      method: 'POST',
      body: JSON.stringify({ test: true })
    });

    if (response.statusCode === 400) {
      addResult('Stripe webhook endpoint', 'PASS', 'Properly validates signatures');
    } else {
      addResult('Stripe webhook endpoint', 'WARN', `Unexpected status: ${response.statusCode}`);
    }
  } catch (error) {
    addResult('Stripe webhook endpoint', 'FAIL', error.message);
  }
}

async function testPWAConfiguration() {
  log('\n📱 PWA Configuration Tests', 'blue');

  // Test manifest
  try {
    const response = await makeRequest(`${APP_URL}/manifest.json`);

    if (response.statusCode === 200) {
      addResult('PWA manifest', 'PASS');

      try {
        const manifest = JSON.parse(response.data);
        if (manifest.name && manifest.icons && manifest.start_url) {
          addResult('PWA manifest content', 'PASS', 'All required fields present');
        } else {
          addResult('PWA manifest content', 'WARN', 'Some fields missing');
        }
      } catch {
        addResult('PWA manifest parsing', 'FAIL', 'Invalid JSON');
      }
    } else {
      addResult('PWA manifest', 'FAIL', `Status: ${response.statusCode}`);
    }
  } catch (error) {
    addResult('PWA manifest', 'FAIL', error.message);
  }

  // Test service worker
  try {
    const response = await makeRequest(`${APP_URL}/sw.js`);

    if (response.statusCode === 200) {
      addResult('Service worker', 'PASS');
    } else {
      addResult('Service worker', 'FAIL', `Status: ${response.statusCode}`);
    }
  } catch (error) {
    addResult('Service worker', 'FAIL', error.message);
  }
}

async function testPerformance() {
  log('\n⚡ Performance Tests', 'blue');

  const startTime = Date.now();

  try {
    const response = await makeRequest(APP_URL);
    const loadTime = Date.now() - startTime;

    if (loadTime < 2000) {
      addResult('Page load time', 'PASS', `${loadTime}ms`);
    } else if (loadTime < 5000) {
      addResult('Page load time', 'WARN', `${loadTime}ms (could be faster)`);
    } else {
      addResult('Page load time', 'FAIL', `${loadTime}ms (too slow)`);
    }

    // Check response size
    const size = Buffer.byteLength(response.data);
    const sizeKB = Math.round(size / 1024);

    if (sizeKB < 500) {
      addResult('Page size', 'PASS', `${sizeKB}KB`);
    } else {
      addResult('Page size', 'WARN', `${sizeKB}KB (consider optimization)`);
    }

  } catch (error) {
    addResult('Performance test', 'FAIL', error.message);
  }
}

async function testEnvironmentVariables() {
  log('\n🌍 Environment Variables Check', 'blue');

  const requiredVars = [
    'NEXTAUTH_URL',
    'DATABASE_URL',
    'NEXT_PUBLIC_APP_URL'
  ];

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      addResult(`Environment: ${varName}`, 'PASS');
    } else {
      addResult(`Environment: ${varName}`, 'FAIL', 'Variable not set');
    }
  });

  // Check Stripe variables
  const stripeVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];

  stripeVars.forEach(varName => {
    if (process.env[varName]) {
      const isLive = process.env[varName].includes('_live_');
      if (isLive) {
        addResult(`Stripe: ${varName}`, 'PASS', 'Live key configured');
      } else {
        addResult(`Stripe: ${varName}`, 'WARN', 'Test key (switch to live for production)');
      }
    } else {
      addResult(`Stripe: ${varName}`, 'FAIL', 'Variable not set');
    }
  });
}

async function runAllTests() {
  log('🚀 Starting Production Tests...', 'cyan');
  log(`Target: ${APP_URL}`, 'blue');

  await testEnvironmentVariables();
  await testHealthCheck();
  await testSecurityHeaders();
  await testDatabaseConnection();
  await testAuthEndpoints();
  await testStripeIntegration();
  await testPWAConfiguration();
  await testPerformance();

  // Summary
  log('\n📊 Test Summary', 'cyan');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`⚠️ Warnings: ${results.warnings}`, 'yellow');
  log(`❌ Failed: ${results.failed}`, 'red');

  const total = results.passed + results.warnings + results.failed;
  const passRate = Math.round((results.passed / total) * 100);

  log(`\n📈 Success Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'yellow');

  if (results.failed === 0) {
    log('\n🎉 All critical tests passed! Ready for production.', 'green');
    return 0;
  } else {
    log(`\n⚠️ ${results.failed} critical issues found. Please fix before production.`, 'red');
    return 1;
  }
}

// Export for CI/CD
if (require.main === module) {
  runAllTests().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    log(`\n💥 Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runAllTests, results };