import { test, expect } from "@playwright/test";

test.describe("Phase 0 — landing + demo + pre-order flow", () => {
  test("landing page renders correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Banyan", exact: true })).toBeVisible();
    await expect(page.getByText("Founder's Office & Co")).toBeVisible();
    await expect(page.getByText("Try the demo (free)")).toBeVisible();
    await expect(page.getByText("Pre-order — ₹1,999")).toBeVisible();
    // Legal disclaimer must be visible
    await expect(
      page.getByText("Banyan generates will-ready documents", { exact: false })
    ).toBeVisible();
  });

  test("demo intake: completes 10 questions and shows pre-order CTA", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByText("10-question demo")).toBeVisible();

    const answers = [
      "Ramesh Kumar Sharma",
      "SBI and HDFC Bank",
      "Yes, SBI FD and HDFC mutual funds",
      "Yes, LIC policy",
      "Yes, a flat in Pune",
      "Yes, EPF from previous employer",
      "Yes, Zerodha demat",
      "Yes, SBI locker",
      "No crypto",
      "My wife, Sunita Sharma",
    ];

    for (const answer of answers) {
      await page.getByPlaceholder("Type your answer and press Enter…").fill(answer);
      await page.keyboard.press("Enter");
      // Brief wait for state update
      await page.waitForTimeout(150);
    }

    // After completing all 10 questions, CTA should appear
    await expect(page.getByText("Ready to build the full registry?")).toBeVisible();
    await expect(page.getByText("Pre-order Banyan — ₹1,999")).toBeVisible();
  });

  test("demo: navigates to pre-order page from CTA", async ({ page }) => {
    await page.goto("/demo");

    const answers = [
      "Test User", "SBI", "FDs", "LIC", "Flat", "EPF", "Zerodha", "Locker", "No", "Wife",
    ];

    for (const answer of answers) {
      await page.getByPlaceholder("Type your answer and press Enter…").fill(answer);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(100);
    }

    await page.getByText("Pre-order Banyan — ₹1,999").click();
    await page.waitForURL("/pre-order");
    await expect(page.getByText("Pre-order Banyan")).toBeVisible();
  });

  test("pre-order page: form renders with required fields", async ({ page }) => {
    await page.goto("/pre-order");
    await expect(page.getByText("Pre-order Banyan")).toBeVisible();
    await expect(page.getByPlaceholder("Ramesh Kumar Sharma")).toBeVisible();
    await expect(page.getByPlaceholder("ramesh@example.com")).toBeVisible();
    await expect(page.getByText("Continue to payment — ₹1,999")).toBeVisible();
  });

  test("pre-order page: submit button disabled until name + email filled", async ({ page }) => {
    await page.goto("/pre-order");
    const btn = page.getByText("Continue to payment — ₹1,999");
    // Initially disabled (empty form)
    await expect(btn).toBeDisabled();

    // Fill name only
    await page.getByPlaceholder("Ramesh Kumar Sharma").fill("Test User");
    await expect(btn).toBeDisabled();

    // Fill email — now enabled
    await page.getByPlaceholder("ramesh@example.com").fill("test@example.com");
    await expect(btn).not.toBeDisabled();
  });

  test("landing page: direct link from landing to pre-order", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Pre-order — ₹1,999").click();
    await page.waitForURL("/pre-order");
    await expect(page.getByText("Pre-order Banyan")).toBeVisible();
  });
});
