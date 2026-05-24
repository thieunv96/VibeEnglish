#!/usr/bin/env node
// Seeds an admin user. Idempotent.
// Override defaults with ADMIN_EMAIL / ADMIN_PASSWORD env vars.
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = (process.env.ADMIN_EMAIL ?? "thieunv96@gmail.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "123";
const name = process.env.ADMIN_NAME ?? "Admin";

const passwordHash = await bcrypt.hash(password, 10);

const user = await prisma.user.upsert({
  where: { email },
  update: { passwordHash, isAdmin: true, name },
  create: { email, passwordHash, isAdmin: true, name },
});

console.log(`✓ admin ready: ${user.email} (isAdmin=${user.isAdmin})`);
await prisma.$disconnect();
