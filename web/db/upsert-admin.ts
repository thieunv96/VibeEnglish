import "dotenv/config";
import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email || !password) {
    console.error("Usage: tsx db/upsert-admin.ts <email> <password>");
    process.exit(1);
  }
  const passwordHash = await argon2.hash(password);
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    await db
      .update(users)
      .set({ passwordHash, role: "admin", name: existing[0].name ?? "Admin" })
      .where(eq(users.email, email));
    console.log(`✓ Updated ${email} (role=admin, password reset)`);
  } else {
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      name: "Admin",
      passwordHash,
      role: "admin",
    });
    console.log(`✓ Created ${email} (role=admin)`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
