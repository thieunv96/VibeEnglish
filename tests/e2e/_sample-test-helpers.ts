/**
 * Shared helpers for sample-test and cefr-test E2E specs.
 * These utilities keep individual spec files under 200 lines by extracting
 * common completion and assertion logic.
 */

import { Page, APIRequestContext } from "@playwright/test";

/** Generate unique email for guest signup (avoids 409 conflicts on rerun) */
export function uniqueEmail(): string {
  return `e2e-st-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/** Answer all questions in a test (modal/runner) with default behaviour:
 * - MCQ: select first option
 * - Fill: type "answer" or leave empty
 * - Match: select first available option (after BLOCKER-1 fix)
 * Default behaviour assumes no forging; suitable for happy-path tests. */
export async function completeTest(page: Page, testType: "sample" | "cefr") {
  const expectedQCount = testType === "sample" ? 10 : 25;
  // Wait for first question to be visible (rely on Playwright's auto-wait)
  const firstQuestion = page.getByTestId("question-0");
  await firstQuestion.waitFor({ state: "visible", timeout: 15_000 });

  // Process all questions in sequence
  let qIndex = 0;
  while (true) {
    const qPrompt = page.getByTestId(`question-${qIndex}`);
    const isVisible = await qPrompt.isVisible().catch(() => false);
    if (!isVisible) break;

    // Detect question type and answer accordingly
    const mcqOption = page.getByTestId(`q${qIndex}-opt-0`);
    const fillInput = page.getByTestId(`q${qIndex}-fill`);
    const matchDiv = page.getByTestId(`q${qIndex}-match`);

    if (await mcqOption.isVisible().catch(() => false)) {
      // MCQ: click first option
      await mcqOption.click();
    } else if (await fillInput.isVisible().catch(() => false)) {
      // Fill: type placeholder answer
      await fillInput.fill("answer");
    } else if (await matchDiv.isVisible().catch(() => false)) {
      // Match: find first select and pick first option
      const select = matchDiv.locator("select").first();
      const options = await select.locator("option").all();
      if (options.length > 1) {
        // Skip placeholder option, use second option
        const optionValue = await options[1].getAttribute("value");
        if (optionValue) {
          await select.selectOption(optionValue);
        }
      }
    }

    // Check button to confirm answer
    const checkBtn = page.getByTestId(`q${qIndex}-check`);
    const isCheckVisible = await checkBtn.isVisible().catch(() => false);
    if (isCheckVisible) {
      await checkBtn.click();
    }

    qIndex++;
  }

  // Find and click submit button (might have different label depending on state)
  const submitBtn = page.getByRole("button").filter({ hasText: /submit|Submit/i }).first();
  await submitBtn.click({ timeout: 15_000 });
}

/** Register a fresh user with a unique email (for guest signup tests).
 * Returns the email used so tests can store it for assertions. */
export async function registerFreshUser(page: Page): Promise<string> {
  const email = uniqueEmail();
  const password = "SecurePass123!";

  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill(password);
  await page.getByTestId("register-name").fill("Test User");
  await page.getByTestId("register-submit").click({ force: true });

  // Wait for redirect to profile or results page (depending on returnTo)
  await page.waitForURL(/\/(profile|sample-test.*results)/, { timeout: 15_000 });
  return email;
}

/** Assert that the server rendered a disclaimer in the raw HTML (AC-9 / CEFR-AC-9).
 * This bypasses hydration to ensure disclaimer is server-side (SSR) not client-side. */
export async function assertServerRenderedDisclaimer(
  request: APIRequestContext,
  url: string,
  expectedText: string
): Promise<void> {
  const response = await request.get(url);
  const html = await response.text();
  if (!html.includes(expectedText)) {
    throw new Error(
      `Disclaimer not found in server HTML. Expected substring: "${expectedText}"\nGot: ${html.substring(0, 500)}...`
    );
  }
}

/** Inject a malformed/tampered sample_test_result cookie to test forged-cookie rejection.
 * Returns the tampered cookie value for inspection. */
export async function injectTamperedCookie(page: Page, testType: "sample" | "cefr"): Promise<string> {
  // Create a plausible but invalid JWT (this will fail signature verification)
  const tamperedValue =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZXN0VHlwZSI6IiIgKHRlc3RUeXBlKSwiY2VyclJFc3RpbWF0ZSI6IkMxKyJ9.TAMPERED_SIGNATURE";
  await page.context().addCookies([
    {
      name: "sample_test_result",
      value: tamperedValue,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  return tamperedValue;
}

/** Fetch raw HTML response using request context (to bypass client-side hydration).
 * Useful for verifying server-rendered content (AC-9). */
export async function getRawHtml(request: APIRequestContext, url: string): Promise<string> {
  const response = await request.get(url);
  return response.text();
}

/** Helper to register and login a user, return email for reference. */
export async function registerAndLogin(page: Page): Promise<string> {
  const email = uniqueEmail();
  const password = "SecurePass123!";
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill(password);
  await page.getByTestId("register-name").fill("Test User");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/profile/);
  return email;
}
