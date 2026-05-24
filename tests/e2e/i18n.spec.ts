import { test, expect } from "@playwright/test";

test("Spanish locale renders translated nav", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Lecciones", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Práctica", exact: true })).toBeVisible();
});

test("French locale renders translated nav", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Leçons", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Pratique", exact: true })).toBeVisible();
});

test("Vietnamese locale renders translated nav", async ({ page }) => {
  await page.goto("/vi");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Bài học", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Luyện tập", exact: true })).toBeVisible();
});

test("English remains at root /", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Lessons", exact: true })).toBeVisible();
});

test("Language switcher routes to /es", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("language-switcher").selectOption("es");
  await page.waitForURL("**/es");
  await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Lecciones", exact: true })).toBeVisible();
});

test("Filter query param survives locale switch", async ({ page }) => {
  await page.goto("/es/lessons/short-stories?level=A1");
  await expect(page.getByTestId("filter-A1")).toHaveClass(/border-brand|bg-brand/);
  await page.getByTestId("language-switcher").selectOption("fr");
  await page.waitForURL((u) => u.pathname.startsWith("/fr/lessons/short-stories") && u.searchParams.get("level") === "A1");
  await expect(page).toHaveURL(/\/fr\/lessons\/short-stories\?.*level=A1/);
  await expect(page.getByTestId("filter-A1")).toHaveClass(/border-brand|bg-brand/);
});
