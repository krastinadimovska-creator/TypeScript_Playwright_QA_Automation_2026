// Hands-On Exercise: Build Your First Complete Test Suite
// Create: lectures/01-playwright/tests/my-first-suite.spec.ts
//
// Write 5 test scenarios:
// 1. Successful login - redirects and shows welcome
// 2. Failed login - stays on page, shows error
// 3. Page structure validation - all elements exist
// 4. Form fields - accept and display input correctly
// 5. Multiple login attempts - handle repeated tries
//
// Use all concepts:
// - async/await with page, locator, expect
// - console.log for tracking
// - test.only for focused debugging
// - page.pause() for exploration
//
// Bonus challenges:
// - Helper functions, advanced assertions

import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const loginPageUrl = pathToFileURL(
  resolve(__dirname, "../pages/login-page.html"),
).href;

// Login page
const selectors = {
  heading: 'xpath=//h1[@id="login-heading"]',
  email: 'xpath=//input[@id="email"]',
  password: 'xpath=//input[@id="password"]',
  showPasswordButton: 'xpath=//button[@id="toggle-password"]',
  rememberEmail: 'xpath=//input[@id="remember-email"]',
  loginButton: 'xpath=//button[@id="login-button"]',
  loginError: 'xpath=//*[@id="login-error"]',
};

// Home page (after a successful login)
const homeSelectors = {
  greeting: 'xpath=//nav[@class="account-nav"]//span[@class="muted"]',
  logoutButton: 'xpath=//button[@id="logout-button"]',
};

test.beforeEach(async ({ page }) => {
  await page.goto(loginPageUrl, { waitUntil: "domcontentloaded" });
});

test("successful login - redirects and shows welcome", async ({ page }) => {
  await page.locator(selectors.email).fill("alex@example.com");
  await page.locator(selectors.password).fill("Playwright123!");
  await page.locator(selectors.loginButton).click();

  await expect(page).toHaveURL(/\/home-page\.html$/);
  await expect(page.locator(homeSelectors.greeting)).toHaveText("Hello, Alex");
  await expect(page.locator(homeSelectors.logoutButton)).toHaveText("Sign out");
});

test("failed login - stays on page, shows error", async ({ page }) => {
  await page.locator(selectors.email).fill("wrongemail@example.com");
  await page.locator(selectors.password).fill("Playwright123!");
  await page.locator(selectors.loginButton).click();

  await expect(page.locator(selectors.loginError)).toHaveText(
    "Email or password is incorrect. Please try again.",
  );
  await expect(page).toHaveURL(loginPageUrl);
});

test("page structure validation - all elements exist", async ({ page }) => {
  const formElements = [
    page.locator(selectors.heading),
    page.locator(selectors.email),
    page.locator(selectors.password),
    page.locator(selectors.showPasswordButton),
    page.locator(selectors.rememberEmail),
    page.locator(selectors.loginButton),
  ];

  for (const element of formElements) {
    await expect(element).toBeVisible();
  }

  await expect(page.locator(selectors.heading)).toHaveText("Welcome back.");
  await expect(page).toHaveTitle("Sign in | Form & Field");
  await expect(page.locator(selectors.loginError)).toBeHidden();
});

test("form fields - accept and display input correctly", async ({ page }) => {
  const emailInput = page.locator(selectors.email);
  const passwordInput = page.locator(selectors.password);
  const showPasswordButton = page.locator(selectors.showPasswordButton);
  const rememberEmailCheckbox = page.locator(selectors.rememberEmail);

  await emailInput.fill("email@example.com");
  await expect(emailInput).toHaveValue("email@example.com");
  console.log("Filled email address (first):", await emailInput.inputValue());

  await emailInput.fill("newemail@example.com");
  await expect(emailInput).toHaveValue("newemail@example.com");
  console.log("Filled email address (second):", await emailInput.inputValue());

  await passwordInput.fill("Playwright123!");
  await expect(passwordInput).toHaveValue("Playwright123!");
  await expect(passwordInput).toHaveAttribute("type", "password");

  await showPasswordButton.click();
  await expect(passwordInput).toHaveAttribute("type", "text");
  await expect(passwordInput).toHaveValue("Playwright123!");

  await rememberEmailCheckbox.check();
  await expect(rememberEmailCheckbox).toBeChecked();
});

test("multiple login attempts - handle repeated tries", async ({ page }) => {
  const passwordInput = page.locator(selectors.password);
  const loginButton = page.locator(selectors.loginButton);
  const loginError = page.locator(selectors.loginError);

  await page.locator(selectors.email).fill("alex@example.com");
  await passwordInput.fill("WrongPasswort1!");
  await loginButton.click();

  await expect(loginError).toHaveText(
    "Email or password is incorrect. Please try again.",
  );
  await expect(page).toHaveURL(loginPageUrl);
  await expect(loginButton).toBeEnabled();

  await passwordInput.fill("WrongPasswort2!");
  await expect(loginError).toBeHidden();

  await loginButton.click();
  await expect(loginError).toHaveText(
    "Email or password is incorrect. Please try again.",
  );

  await passwordInput.fill("Playwright123!");
  await loginButton.click();

  await expect(loginError).toBeVisible();
  await expect(loginError).toHaveText(
    "Email or password is incorrect. Please try again.",
  );
});

// Answer: How the concepts were used
// - async/await with page, locator, expect: every test uses page.locator() with XPath selectors,
//   awaits each action (fill, click, check) and verifies the result with expect.
// - console.log for tracking: test 4 logs the email field value with inputValue() after each fill.
// - test.only: I added .only to test 5 while writing it, ran the file and confirmed that only
//   that test ran and the others were skipped. I removed it before submitting.
// - page.pause(): I added it after the first failed login in test 5, ran the file with --headed,
//   explored the page in Playwright Inspector and used "Pick locator" to check my selectors.
//   I removed it before submitting.
//
// Bonus:
// - Helper object: all XPath selectors are defined once in the selectors and homeSelectors objects,
//   so a changed ID needs to be updated in one place only.
// - Advanced assertions: a for...of loop checks every form element in test 3, toHaveAttribute
//   checks the password type before and after "Show", toBeHidden checks the hidden error message,
//   and toBeEnabled checks the button after a failed attempt.
