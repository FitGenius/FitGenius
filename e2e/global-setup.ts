import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  // Create a browser instance for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the app to be ready
    await page.goto('http://localhost:3000');

    // Wait for the page to load completely
    await page.waitForSelector('text=FitGenius', { timeout: 30000 });

    console.log('✅ Application is ready for testing');

    // You can add setup for test users, database seeding, etc. here

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;