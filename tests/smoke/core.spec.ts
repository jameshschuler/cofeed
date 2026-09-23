import { expect, test, type Page } from "@playwright/test";

const smokeEmail = process.env.COFEED_SMOKE_EMAIL;
const smokePassword = process.env.COFEED_SMOKE_PASSWORD;
const hasSmokeCredentials = Boolean(smokeEmail && smokePassword);

test.describe("CoFeed mobile smoke flows", () => {
  test.skip(
    !hasSmokeCredentials,
    "Set COFEED_SMOKE_EMAIL and COFEED_SMOKE_PASSWORD to run authenticated smoke tests.",
  );

  async function signIn(page: Page) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(smokeEmail!);
    await page.getByLabel("Password").fill(smokePassword!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/dashboard/);
  }

  test("logs, edits, and deletes a feed", async ({ page }) => {
    await signIn(page);
    await page.goto("/feeds");

    await page.getByRole("button", { name: "Log a bottle" }).click();
    await page.locator("#feed-formula-volume").fill("120");
    await page.getByRole("button", { name: "Log Bottle" }).click();
    await expect(page.getByText("Feed saved.")).toBeVisible();

    const feedCard = page.locator("div.rounded-lg.border.bg-background").first();
    await feedCard.getByRole("button", { name: "Edit bottle" }).click();
    await expect(page.getByRole("heading", { name: "Edit bottle" })).toBeVisible();
    await page.getByLabel("Formula amount").fill("130");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Feed updated.")).toBeVisible();

    await feedCard.getByRole("button", { name: "Delete bottle" }).click();
    await page.getByRole("heading", { name: "Delete this bottle log?" }).waitFor();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText("Feed deleted.")).toBeVisible();
  });

  test("opens the password reset flow", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/reset-password/);
    await expect(
      page.getByRole("heading", { name: "Reset your password" }),
    ).toBeVisible();
    await page.getByLabel("Email").fill(smokeEmail!);
    await page.getByRole("button", { name: "Send Reset Link" }).click();
    await expect(
      page.getByText("Check your email for a password reset link."),
    ).toBeVisible();
  });

  test("shows the PWA install affordance", async ({ page }) => {
    await signIn(page);
    await page.goto("/account");

    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      Object.defineProperties(event, {
        prompt: { value: async () => undefined },
        userChoice: { value: Promise.resolve({ outcome: "dismissed" }) },
      });
      window.dispatchEvent(event);
    });

    await expect(
      page.getByRole("button", { name: "Add to home screen" }),
    ).toBeVisible();
  });
});
