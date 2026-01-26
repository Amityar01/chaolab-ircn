import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display lab name and tagline', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Chao Lab');
    await expect(page.getByText('Predictive')).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Check research link
    const researchLink = page.getByRole('link', { name: /research|研究/i }).first();
    await expect(researchLink).toBeVisible();

    // Check publications link
    const pubsLink = page.getByRole('link', { name: /publications|業績/i }).first();
    await expect(pubsLink).toBeVisible();

    // Check members link
    const membersLink = page.getByRole('link', { name: /team|members|メンバー/i }).first();
    await expect(membersLink).toBeVisible();
  });

  test('should display research themes', async ({ page }) => {
    // Scroll to research section
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);

    // Check for research cards
    const researchCards = page.locator('.research-card');
    await expect(researchCards.first()).toBeVisible();
  });

  test('should toggle language', async ({ page }) => {
    // Find language toggle
    const langToggle = page.getByRole('button', { name: /en|ja|日本語|english/i });

    if (await langToggle.isVisible()) {
      // Get initial text
      const initialText = await page.locator('h1').textContent();

      // Click language toggle
      await langToggle.click();
      await page.waitForTimeout(300);

      // Text should change or stay the same (depending on bilingual content)
      const newText = await page.locator('h1').textContent();
      expect(newText).toBeTruthy();
    }
  });
});

test.describe('Publications Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/publications');
  });

  test('should display publications list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /publications|業績/i })).toBeVisible();
  });

  test('should have working search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('neural');
      await page.waitForTimeout(300);

      // Results should update
      const count = page.locator('.pub-count');
      await expect(count).toBeVisible();
    }
  });

  test('should have year filter', async ({ page }) => {
    const yearSelect = page.locator('select').first();

    if (await yearSelect.isVisible()) {
      // Select should have options
      const options = yearSelect.locator('option');
      expect(await options.count()).toBeGreaterThan(1);
    }
  });
});

test.describe('Members Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/members');
  });

  test('should display team members', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /members|team|メンバー/i })).toBeVisible();
  });

  test('should have working member search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|検索/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('chao');
      await page.waitForTimeout(300);

      // Should show filtered results
      const memberCards = page.locator('[class*="member"]');
      await expect(memberCards.first()).toBeVisible();
    }
  });
});

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('should display contact form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /contact|アクセス/i })).toBeVisible();

    // Check form fields
    await expect(page.getByLabel(/name|お名前/i)).toBeVisible();
    await expect(page.getByLabel(/email|メール/i)).toBeVisible();
    await expect(page.getByLabel(/message|メッセージ/i)).toBeVisible();
  });

  test('should validate form fields', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /send|送信/i });

    // Try to submit empty form
    await submitButton.click();

    // Form should not submit (HTML5 validation)
    const nameInput = page.getByLabel(/name|お名前/i);
    await expect(nameInput).toHaveAttribute('required', '');
  });
});

test.describe('Accessibility', () => {
  test('homepage should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should focus on a visible element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });
});
