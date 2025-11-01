import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Check that the page has loaded (you can customize this assertion based on your actual homepage)
  await expect(page).toHaveTitle(/SubSpace/i);
});

test('navigation works', async ({ page }) => {
  await page.goto('/');

  // Example: Click a link and verify navigation
  // Customize based on your actual application
  await expect(page).toHaveURL(/localhost:3000/);
});
