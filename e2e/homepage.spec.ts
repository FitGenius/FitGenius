import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the main landing page', async ({ page }) => {
    await page.goto('/');

    // Check main heading
    await expect(page.locator('h2')).toContainText('A Plataforma Premium para');
    await expect(page.locator('h2')).toContainText('Profissionais da Saúde');

    // Check logo
    await expect(page.locator('text=FitGenius')).toBeVisible();

    // Check navigation
    await expect(page.locator('a[href="/auth/signin"]')).toBeVisible();
    await expect(page.locator('a[href="/auth/signup"]')).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');

    // Test "Entrar" button
    const signinButton = page.locator('a[href="/auth/signin"]').first();
    await expect(signinButton).toBeVisible();

    // Test "Começar Grátis" button
    const signupButton = page.locator('a[href="/auth/signup"]').first();
    await expect(signupButton).toBeVisible();

    // Test demo button
    const demoButton = page.locator('a[href="/dashboard/professional"]');
    await expect(demoButton).toBeVisible();
  });

  test('should display features section', async ({ page }) => {
    await page.goto('/');

    // Check features heading
    await expect(page.locator('text=Recursos Profissionais')).toBeVisible();

    // Check key features
    await expect(page.locator('text=Prescrição de Treinos')).toBeVisible();
    await expect(page.locator('text=Planos Nutricionais')).toBeVisible();
    await expect(page.locator('text=Gestão de Clientes')).toBeVisible();
    await expect(page.locator('text=Analytics Avançado')).toBeVisible();
    await expect(page.locator('text=Conformidade LGPD')).toBeVisible();
    await expect(page.locator('text=Gamificação')).toBeVisible();
  });

  test('should display stats section', async ({ page }) => {
    await page.goto('/');

    // Check stats
    await expect(page.locator('text=10K+')).toBeVisible();
    await expect(page.locator('text=Profissionais Ativos')).toBeVisible();
    await expect(page.locator('text=50K+')).toBeVisible();
    await expect(page.locator('text=Clientes Atendidos')).toBeVisible();
    await expect(page.locator('text=1M+')).toBeVisible();
    await expect(page.locator('text=Treinos Registrados')).toBeVisible();
    await expect(page.locator('text=99.9%')).toBeVisible();
    await expect(page.locator('text=Uptime Garantido')).toBeVisible();
  });

  test('should display pricing section', async ({ page }) => {
    await page.goto('/');

    // Check pricing heading
    await expect(page.locator('text=Planos Transparentes')).toBeVisible();

    // Check pricing plans
    await expect(page.locator('text=Gratuito')).toBeVisible();
    await expect(page.locator('text=R$ 0')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
    await expect(page.locator('text=R$ 97')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
    await expect(page.locator('text=R$ 197')).toBeVisible();
  });

  test('should have working CTA buttons', async ({ page }) => {
    await page.goto('/');

    // Check main CTA
    const mainCTA = page.locator('text=Teste Gratuito por 14 Dias');
    await expect(mainCTA).toBeVisible();

    // Check footer CTA
    const footerCTA = page.locator('text=Começar Teste Gratuito Agora');
    await expect(footerCTA).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    await page.goto('/');

    // Check footer content
    await expect(page.locator('text=© 2024 FitGenius')).toBeVisible();
    await expect(page.locator('text=Feito com ❤️ para profissionais da saúde no Brasil')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that main elements are still visible on mobile
    await expect(page.locator('text=FitGenius')).toBeVisible();
    await expect(page.locator('text=A Plataforma Premium')).toBeVisible();

    // Check mobile-specific layout
    const mobileMenu = page.locator('.md\\:flex').first();
    if (await mobileMenu.isVisible()) {
      // Desktop menu is hidden on mobile
      await expect(mobileMenu).toHaveCSS('display', /none|hidden/);
    }
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/FitGenius/);

    // Check meta description (if present)
    const metaDescription = page.locator('meta[name="description"]');
    if (await metaDescription.count() > 0) {
      await expect(metaDescription).toHaveAttribute('content', /fitness|treino|nutrição|saúde/i);
    }
  });
});