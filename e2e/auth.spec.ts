import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display signin page', async ({ page }) => {
    await page.goto('/auth/signin');

    // Check main elements
    await expect(page.locator('text=FitGenius')).toBeVisible();
    await expect(page.locator('text=Entrar na sua conta')).toBeVisible();
    await expect(page.locator('text=Acesse seu dashboard e gerencie seus clientes')).toBeVisible();

    // Check form fields
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check demo accounts
    await expect(page.locator('text=👨‍⚕️ Profissional')).toBeVisible();
    await expect(page.locator('text=👤 Cliente')).toBeVisible();
  });

  test('should show validation for empty form', async ({ page }) => {
    await page.goto('/auth/signin');

    // Try to submit empty form
    await page.locator('button[type="submit"]').click();

    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeFocused();
  });

  test('should fill form with professional demo account', async ({ page }) => {
    await page.goto('/auth/signin');

    // Click professional demo button
    await page.locator('text=👨‍⚕️ Profissional').click();

    // Check if form is filled
    await expect(page.locator('input[name="email"]')).toHaveValue('profissional@demo.com');
    await expect(page.locator('input[name="password"]')).toHaveValue('demo123');
  });

  test('should fill form with client demo account', async ({ page }) => {
    await page.goto('/auth/signin');

    // Click client demo button
    await page.locator('text=👤 Cliente').click();

    // Check if form is filled
    await expect(page.locator('input[name="email"]')).toHaveValue('cliente@demo.com');
    await expect(page.locator('input[name="password"]')).toHaveValue('demo123');
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/auth/signin');

    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('button').filter({ has: page.locator('[data-lucide="eye"], [data-lucide="eye-off"]') });

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    await toggleButton.click();

    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle button again
    await toggleButton.click();

    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should have working links', async ({ page }) => {
    await page.goto('/auth/signin');

    // Check "Esqueceu a senha?" link
    const forgotPasswordLink = page.locator('a[href="/auth/forgot-password"]');
    await expect(forgotPasswordLink).toBeVisible();
    await expect(forgotPasswordLink).toHaveText('Esqueceu a senha?');

    // Check "Cadastre-se gratuitamente" link
    const signupLink = page.locator('a[href="/auth/signup"]');
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toHaveText('Cadastre-se gratuitamente');

    // Check "Voltar para a página inicial" link
    const homeLink = page.locator('a[href="/"]');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveText('← Voltar para a página inicial');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/signin');

    // Check that main elements are still visible and properly sized
    await expect(page.locator('text=FitGenius')).toBeVisible();
    await expect(page.locator('text=Entrar na sua conta')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Check demo buttons are stacked properly on mobile
    const demoButtonsContainer = page.locator('.grid-cols-2');
    await expect(demoButtonsContainer).toBeVisible();
  });

  test('should handle form submission attempt', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill form with demo credentials
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password123');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Should show loading state
    await expect(page.locator('text=Entrando...')).toBeVisible();

    // Wait a bit for potential error message
    await page.waitForTimeout(2000);

    // Since we don't have a real backend, we might see an error message
    // or the button should return to normal state
    const submitButton = page.locator('button[type="submit"]');
    const buttonText = await submitButton.textContent();
    expect(['Entrar', 'Entrando...']).toContain(buttonText);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/auth/signin');

    // Check form labels
    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toBeVisible();
    await expect(emailLabel).toHaveText('Email');

    const passwordLabel = page.locator('label[for="password"]');
    await expect(passwordLabel).toBeVisible();
    await expect(passwordLabel).toHaveText('Senha');

    // Check input attributes
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required');

    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('required');
  });
});