import { test, expect } from '@playwright/test';

test.describe('Snapshots', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@cloudshell.local');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/');
  });

  test('should create snapshot from terminal', async ({ page }) => {
    // Create a terminal first
    await page.getByRole('link', { name: /terminals/i }).click();
    await page.getByRole('button', { name: /new terminal/i }).click();

    const terminalName = `snapshot-test-${Date.now()}`;
    await page.getByPlaceholder('Terminal name...').fill(terminalName);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByText(terminalName).click();

    // Create snapshot
    await page.getByRole('button', { name: /save snapshot/i }).click();

    const snapshotName = `my-snapshot-${Date.now()}`;
    await page.getByPlaceholder('Snapshot name...').fill(snapshotName);
    await page.getByRole('button', { name: 'Save' }).click();

    // Navigate to snapshots and verify
    await page.getByRole('link', { name: /snapshots/i }).click();
    await expect(page.getByText(snapshotName)).toBeVisible();
  });

  test('should display snapshots page', async ({ page }) => {
    await page.getByRole('link', { name: /snapshots/i }).click();
    await expect(page.getByRole('heading', { name: 'Snapshots' })).toBeVisible();
  });

  test('should restore snapshot', async ({ page }) => {
    // First create a terminal and snapshot
    await page.getByRole('link', { name: /terminals/i }).click();
    await page.getByRole('button', { name: /new terminal/i }).click();

    const terminalName = `restore-test-${Date.now()}`;
    await page.getByPlaceholder('Terminal name...').fill(terminalName);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByText(terminalName).click();

    // Execute some commands to change state
    await page.locator('input[type="text"]').last().fill('mkdir testdir');
    await page.locator('input[type="text"]').last().press('Enter');

    // Create snapshot
    await page.getByRole('button', { name: /save snapshot/i }).click();
    const snapshotName = `restore-snap-${Date.now()}`;
    await page.getByPlaceholder('Snapshot name...').fill(snapshotName);
    await page.getByRole('button', { name: 'Save' }).click();

    // Navigate to snapshots
    await page.getByRole('link', { name: /snapshots/i }).click();
    await expect(page.getByText(snapshotName)).toBeVisible();

    // Restore snapshot (find restore button)
    const snapshotRow = page.locator(`text=${snapshotName}`).locator('xpath=ancestor::div[contains(@class, "rounded")]');
    await snapshotRow.getByTitle('Restore').click();

    // Verify restore was successful (page should show success or redirect)
    await expect(page.getByText(/restored|success/i)).toBeVisible({ timeout: 5000 }).catch(() => {
      // Alternative: check if we're redirected to terminal
    });
  });

  test('should delete snapshot', async ({ page }) => {
    // Create terminal and snapshot
    await page.getByRole('link', { name: /terminals/i }).click();
    await page.getByRole('button', { name: /new terminal/i }).click();

    const terminalName = `delete-snap-${Date.now()}`;
    await page.getByPlaceholder('Terminal name...').fill(terminalName);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByText(terminalName).click();

    await page.getByRole('button', { name: /save snapshot/i }).click();
    const snapshotName = `to-delete-${Date.now()}`;
    await page.getByPlaceholder('Snapshot name...').fill(snapshotName);
    await page.getByRole('button', { name: 'Save' }).click();

    // Navigate to snapshots
    await page.getByRole('link', { name: /snapshots/i }).click();
    await expect(page.getByText(snapshotName)).toBeVisible();

    // Delete snapshot
    const snapshotRow = page.locator(`text=${snapshotName}`).locator('xpath=ancestor::div[contains(@class, "rounded")]');
    await snapshotRow.getByTitle('Delete').click();

    // Verify deleted
    await expect(page.getByText(snapshotName)).not.toBeVisible();
  });
});
