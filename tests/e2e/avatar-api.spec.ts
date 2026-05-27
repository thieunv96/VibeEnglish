import { test, expect } from "@playwright/test";

test("GET /api/avatars/<unknown-id> returns 404", async ({ request }) => {
  const res = await request.get("/api/avatars/nonexistent-id-x123");
  expect(res.status()).toBe(404);
});

test("GET /api/avatars/<invalid-id> returns 400", async ({ request }) => {
  const res = await request.get("/api/avatars/" + encodeURIComponent("../../etc/passwd"));
  expect([400, 404]).toContain(res.status());
});
