import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

// The demo account the simulation adds. See docs/app/simulation.md#the-demo-account
const DEMO = { username: "demo", password: "demo-password" };

async function signIn(page: Page, { username, password }: typeof DEMO) {
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test("a link goes from shortened to followed", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in\?next=/);
  await signIn(page, DEMO);
  await expect(page.getByRole("heading", { name: "Links" })).toBeVisible();

  await page.getByLabel("Target URL").fill("https://example.com/from-the-browser");
  await page.getByLabel("Slug").fill("from-the-browser");
  await page.getByRole("button", { name: "Shorten", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("/s/from-the-browser");

  await page.getByRole("link", { name: "/from-the-browser" }).click();
  await expect(page.getByRole("heading", { name: /\/s\/from-the-browser$/ })).toBeVisible();
  await page.getByRole("link", { name: "Open" }).click();
  await expect(
    page.getByRole("heading", { name: "https://example.com/from-the-browser" }),
  ).toBeVisible();
});

test("a new account starts empty, and signs out", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Username").fill("newcomer");
  await page.getByLabel("Password").fill("a-long-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("No links yet.")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("status")).toHaveText("You're signed out.");
});

test("an address opened directly is served by the app", async ({ page }) => {
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await signIn(page, DEMO);
  await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
});
