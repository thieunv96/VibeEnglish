/**
 * Shared helpers for sample-test and cefr-test E2E specs.
 * Auth-gated single-page flow — no cookie/teaser/signup-claim helpers here.
 */

import { Page } from "@playwright/test";

export function uniqueEmail(): string {
  return `e2e-st-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * Walk through every question with a default answer:
 *   MCQ   → first option
 *   fill  → literal "answer"
 *   match → second <option> in the first <select>
 * Then click Submit.
 */
export async function completeTest(page: Page) {
  const firstQuestion = page.getByTestId("question-0");
  await firstQuestion.waitFor({ state: "visible", timeout: 15_000 });

  let qIndex = 0;
  while (true) {
    const qPrompt = page.getByTestId(`question-${qIndex}`);
    if (!(await qPrompt.isVisible().catch(() => false))) break;

    const mcqOption = page.getByTestId(`q${qIndex}-opt-0`);
    const fillInput = page.getByTestId(`q${qIndex}-fill`);
    const matchDiv = page.getByTestId(`q${qIndex}-match`);

    if (await mcqOption.isVisible().catch(() => false)) {
      await mcqOption.click();
    } else if (await fillInput.isVisible().catch(() => false)) {
      await fillInput.fill("answer");
    } else if (await matchDiv.isVisible().catch(() => false)) {
      const select = matchDiv.locator("select").first();
      const options = await select.locator("option").all();
      if (options.length > 1) {
        const optionValue = await options[1].getAttribute("value");
        if (optionValue) await select.selectOption(optionValue);
      }
    }

    const checkBtn = page.getByTestId(`q${qIndex}-check`);
    if (await checkBtn.isVisible().catch(() => false)) {
      await checkBtn.click();
    }

    qIndex++;
  }

  const submitBtn = page.getByRole("button").filter({ hasText: /submit|Submit/i }).first();
  await submitBtn.click({ timeout: 15_000 });
}

/** Register a fresh user and end on /profile. Returns the email used. */
export async function registerAndLogin(page: Page): Promise<string> {
  const email = uniqueEmail();
  const password = "SecurePass123!";
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill(password);
  await page.getByTestId("register-name").fill("Test User");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/profile/, { timeout: 15_000 });
  return email;
}

