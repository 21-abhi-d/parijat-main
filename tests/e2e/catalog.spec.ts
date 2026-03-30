/**
 * E2e: Product catalog page.
 * Tests browsing, filter interaction, and basic product card rendering.
 * Fully fleshed out in Phase 2 when the catalog page is implemented.
 */
import { expect, test } from "@playwright/test";

test("catalog page loads", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page.getByRole("heading", { name: /collection/i })).toBeVisible();
});

test("home page loads with navigation links", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Parijat")).toBeVisible();
  const catalogLink = page.getByRole("link", { name: /browse collection/i });
  await expect(catalogLink).toBeVisible();
});

test("unauthenticated access to /admin redirects to sign-in", async ({ page }) => {
  await page.goto("/admin");
  // Should redirect to /auth/signin
  await expect(page).toHaveURL(/\/auth\/signin/);
});
