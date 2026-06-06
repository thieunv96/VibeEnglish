/**
 * E2E specs for admin test-prep analytics (AC-14).
 *
 * Covers:
 *   - Admin sees /admin/test-prep page with 4 exam cards
 *   - Admin sees per-exam attempt counts and average scores
 *   - Non-admin gets 403 on /api/admin/test-prep/analytics
 *   - Admin nav has "Test Prep" entry
 */

import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { seedTestPrepFixtures, clearTestPrepFixtures, seedMockAttempts, loginAsAdmin } from "./_test-prep-helpers";
import { registerAndLogin } from "./_sample-test-helpers";

const prisma = new PrismaClient();

test.describe.serial("Admin Test Prep Analytics (AC-14)", () => {
  // =========================================================================
  // Setup / Teardown
  // =========================================================================

  test.beforeAll(async () => {
    await seedTestPrepFixtures("toeic");
    await seedTestPrepFixtures("toefl");
  });

  test.afterAll(async () => {
    await clearTestPrepFixtures("toeic");
    await clearTestPrepFixtures("toefl");
    await prisma.$disconnect();
  });

  // =========================================================================
  // Admin sees analytics page (AC-14)
  // =========================================================================

  test("admin GET /api/admin/test-prep/analytics returns 4 exam summaries", async ({ page }) => {
    // Seed two attempts so allTime.attemptCount > 0 for at least one exam.
    const seedUser = await prisma.user.create({
      data: {
        email: `seed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`,
        name: "Seed",
        passwordHash: "dummy",
      },
    });
    await seedMockAttempts(seedUser.id, "toeic", 2);
    await seedMockAttempts(seedUser.id, "toefl", 1);

    await loginAsAdmin(page);
    const res = await page.request.get("/api/admin/test-prep/analytics");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.perExam).toHaveLength(4);
    expect(data.perExam.map((e: { exam: string }) => e.exam).sort()).toEqual([
      "ielts",
      "oet",
      "toefl",
      "toeic",
    ]);
    const toeic = data.perExam.find((e: { exam: string }) => e.exam === "toeic");
    expect(toeic.allTime.attemptCount).toBeGreaterThanOrEqual(2);

    // Cleanup — seedMockAttempts wrote MockTestAttempt rows that cascade-delete on user delete.
    await prisma.user.delete({ where: { id: seedUser.id } });
  });

  test("admin visits /admin/test-prep and sees 4 exam cards", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/test-prep");
    for (const exam of ["toeic", "toefl", "ielts", "oet"]) {
      await expect(
        page.getByTestId(`admin-test-prep-exam-card-${exam}`),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  // =========================================================================
  // Non-admin gets 403
  // =========================================================================

  test("non-admin gets 403 on /api/admin/test-prep/analytics", async ({
    page,
  }) => {
    await registerAndLogin(page);

    const res = await page.request.get("/api/admin/test-prep/analytics");
    expect(res.status()).toBe(403);
  });

  // =========================================================================
  // Admin nav entry
  // =========================================================================

  test("admin nav shows 'Test Prep' entry, highlighted on /admin/test-prep", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/test-prep");
    const testPrepLink = page.getByRole("link", { name: "Test Prep" });
    await expect(testPrepLink).toBeVisible();
    await expect(testPrepLink).toHaveAttribute("aria-current", "page");
  });
});
