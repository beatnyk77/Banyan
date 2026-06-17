import { test, expect } from "@playwright/test";

const password = "TestPass123!";
const email = `e2e-${Date.now()}@local.test`;

test.describe.serial("Authenticated product flows", () => {
  test("signup → consent → intake → dashboard nav", async ({ page }) => {
    await page.goto("/signup");
    await page.getByPlaceholder("Full name").fill("E2E Test User");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password (min 8 characters)").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Data Processing Consent")).toBeVisible();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "I Consent — Continue" }).click();

    await page.waitForURL("/intake");
    await expect(page.getByText("Unlock your registry")).toBeVisible();
    await expect(page.getByRole("link", { name: "Registry" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Will" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Vault" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Billing" })).toBeVisible();
  });

  test("intake unlock + chat turn (no Anthropic key fallback)", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/intake");

    await page.getByPlaceholder("Vault passphrase").fill("testpassphrase1");
    await page.getByRole("button", { name: "Begin intake" }).click();
    await expect(page.getByPlaceholder("Type your answer and press Enter…")).toBeVisible({
      timeout: 10000,
    });

    await page.getByPlaceholder("Type your answer and press Enter…").fill("Ramesh Kumar Sharma");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Ramesh Kumar Sharma").first()).toBeVisible({ timeout: 15000 });
  });

  test("will, vault, and billing pages load when authenticated", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("/intake");

    await page.goto("/will");
    await expect(page.getByText("Unlock your will draft")).toBeVisible();

    await page.goto("/vault");
    await expect(page.getByText("Unlock your vault")).toBeVisible();

    await page.goto("/billing");
    await expect(page.getByText("Plans & billing")).toBeVisible();
    await expect(page.getByText("₹2,499")).toBeVisible();
  });
});