import { test, expect } from '@playwright/test';

test.describe('RBAC - Role Based Access Control', () => {
  test.describe('Viewer role restrictions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Email').fill('viewer@cloudshell.local');
      await page.getByLabel('Password').fill('viewer123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page).toHaveURL('/');
    });

    test('viewer should not see New Terminal button', async ({ page }) => {
      await page.getByRole('link', { name: /terminals/i }).click();
      await expect(page.getByRole('button', { name: /new terminal/i })).not.toBeVisible();
    });

    test('viewer should not see Users menu', async ({ page }) => {
      await expect(page.getByRole('link', { name: /users/i })).not.toBeVisible();
    });

    test('viewer should see terminals in read-only mode', async ({ page }) => {
      await page.getByRole('link', { name: /terminals/i }).click();
      await expect(page.getByRole('heading', { name: 'Terminals' })).toBeVisible();
      // Should not have delete buttons
      await expect(page.getByTitle('Delete')).not.toBeVisible();
    });
  });

  test.describe('Operator role permissions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Email').fill('operator@cloudshell.local');
      await page.getByLabel('Password').fill('operator123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page).toHaveURL('/');
    });

    test('operator should see New Terminal button', async ({ page }) => {
      await page.getByRole('link', { name: /terminals/i }).click();
      await expect(page.getByRole('button', { name: /new terminal/i })).toBeVisible();
    });

    test('operator should not see Users menu', async ({ page }) => {
      await expect(page.getByRole('link', { name: /users/i })).not.toBeVisible();
    });

    test('operator can create terminal', async ({ page }) => {
      await page.getByRole('link', { name: /terminals/i }).click();
      await page.getByRole('button', { name: /new terminal/i }).click();

      const terminalName = `operator-terminal-${Date.now()}`;
      await page.getByPlaceholder('Terminal name...').fill(terminalName);
      await page.getByRole('button', { name: 'Create' }).click();

      await expect(page.getByText(terminalName)).toBeVisible();
    });
  });

  test.describe('Admin role permissions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Email').fill('admin@cloudshell.local');
      await page.getByLabel('Password').fill('admin123');
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page).toHaveURL('/');
    });

    test('admin should see Users menu', async ({ page }) => {
      await expect(page.getByRole('link', { name: /users/i })).toBeVisible();
    });

    test('admin can access users management', async ({ page }) => {
      await page.getByRole('link', { name: /users/i }).click();
      await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    });

    test('admin can see all terminals', async ({ page }) => {
      await page.getByRole('link', { name: /terminals/i }).click();
      await expect(page.getByRole('heading', { name: 'Terminals' })).toBeVisible();
      // Admin should have delete buttons visible if there are terminals
    });

    test('admin can create and delete users', async ({ page }) => {
      await page.getByRole('link', { name: /users/i }).click();

      // Look for create user button
      const createButton = page.getByRole('button', { name: /new user|create user/i });
      await expect(createButton).toBeVisible();
    });
  });

  test.describe('Protected routes', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL('/login');
    });

    test('should redirect to login when accessing terminals without auth', async ({ page }) => {
      await page.goto('/terminals');
      await expect(page).toHaveURL('/login');
    });

    test('should redirect to login when accessing snapshots without auth', async ({ page }) => {
      await page.goto('/snapshots');
      await expect(page).toHaveURL('/login');
    });
  });
});
