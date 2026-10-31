import { test, expect } from '@playwright/test';

test.describe('Terminals', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@cloudshell.local');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/');

    // Navigate to terminals
    await page.getByRole('link', { name: /terminals/i }).click();
    await expect(page).toHaveURL('/terminals');
  });

  test('should display terminals page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Terminals' })).toBeVisible();
    await expect(page.getByRole('button', { name: /new terminal/i })).toBeVisible();
  });

  test('should create new terminal', async ({ page }) => {
    await page.getByRole('button', { name: /new terminal/i }).click();

    await expect(page.getByText('Create New Terminal')).toBeVisible();

    const terminalName = `test-terminal-${Date.now()}`;
    await page.getByPlaceholder('Terminal name...').fill(terminalName);
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for terminal to appear in list
    await expect(page.getByText(terminalName)).toBeVisible();
  });

  test('should open terminal view', async ({ page }) => {
    // Create a terminal first
    await page.getByRole('button', { name: /new terminal/i }).click();
    const terminalName = `view-test-${Date.now()}`;
    await page.getByPlaceholder('Terminal name...').fill(terminalName);
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText(terminalName)).toBeVisible();

    // Click on terminal to open
    await page.getByText(terminalName).click();

    // Verify terminal view
    await expect(page.getByText(/welcome to cloudshell/i)).toBeVisible();
  });

  test('should execute command in terminal', async ({ page }) => {
    // Create and open terminal
    await page.getByRole('button', { name: /new terminal/i }).click();
    const terminalName = `exec-test-${Date.now()}`;
    await page.getByPlaceholder('Terminal name...').fill(terminalName);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByText(terminalName).click();

    // Start terminal if needed
    const startButton = page.getByTitle('Start');
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Execute pwd command
    await page.locator('input[type="text"]').last().fill('pwd');
    await page.locator('input[type="text"]').last().press('Enter');

    await expect(page.getByText('/home/user')).toBeVisible();
  });

  test('should execute ls command', async ({ page }) => {
    await page.getByRole('button', { name: /new terminal/i }).click();
    const terminalName = `ls-test-${Date.now()}`;
    await page.getByPlaceholder('Terminal name...').fill(terminalName);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByText(terminalName).click();

    await page.locator('input[type="text"]').last().fill('ls');
    await page.locator('input[type="text"]').last().press('Enter');

    // Should show directory contents
    await expect(page.getByText(/documents|downloads/i)).toBeVisible();
  });

  test('should execute help command', async ({ page }) => {
    await page.getByRole('button', { name: /new terminal/i }).click();
    const terminalName = `help-test-${Date.now()}`;
    await page.getByPlaceholder('Terminal name...').fill(terminalName);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByText(terminalName).click();

    await page.locator('input[type="text"]').last().fill('help');
    await page.locator('input[type="text"]').last().press('Enter');

    // Should show available commands
    await expect(page.getByText(/available commands/i)).toBeVisible();
  });

  test('should delete terminal', async ({ page }) => {
    // Create terminal
    await page.getByRole('button', { name: /new terminal/i }).click();
    const terminalName = `delete-test-${Date.now()}`;
    await page.getByPlaceholder('Terminal name...').fill(terminalName);
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText(terminalName)).toBeVisible();

    // Delete it
    const row = page.locator(`text=${terminalName}`).locator('..');
    await row.getByTitle('Delete').click();

    // Wait for it to disappear
    await expect(page.getByText(terminalName)).not.toBeVisible();
  });
});
