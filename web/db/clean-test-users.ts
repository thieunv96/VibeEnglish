import "dotenv/config";
import { db } from "./index";
import { users } from "./schema";
import { like, or } from "drizzle-orm";

/**
 * Remove e2e test users that match the helpers' uniqEmail patterns.
 * Run as: pnpm --filter web db:clean-test-users
 */
async function main() {
  const result = await db
    .delete(users)
    .where(
      or(
        like(users.email, "onb-%@vibe.test"),
        like(users.email, "%@vibe.test"),
        like(users.email, "playwright-%")
      )
    );
  console.log("✓ Removed test users", result);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
