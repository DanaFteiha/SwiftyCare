// =============================================================================
// Staff user seeding
// -----------------------------------------------------------------------------
// On boot we upsert staff accounts from environment variables so a fresh
// deployment has working logins without a user-management UI (which is a later
// iteration). Passwords are read from env, hashed with bcrypt, and never stored
// in plaintext.
//
//   <ROLE>_USERNAME / <ROLE>_PASSWORD   for ROLE in DOCTOR, NURSE, INTAKE, ADMIN
//
// In production NOTHING is seeded unless explicit credentials are provided. In
// development, if no credentials are configured at all, a clearly-labelled set
// of dev accounts is created so local work is frictionless.
// =============================================================================

import { User, hashPassword } from "../models/User.js";
import type { Role } from "../config/auth.js";

interface SeedSpec {
  role: Role;
  username: string | undefined;
  password: string | undefined;
}

async function upsertUser(role: Role, username: string, password: string): Promise<void> {
  const existing = await User.findOne({ username: username.toLowerCase() });
  if (existing) return; // never silently overwrite an existing account's password

  await User.create({
    username: username.toLowerCase(),
    passwordHash: await hashPassword(password),
    role,
    displayName: username,
    active: true,
  });
  console.log(`👤 Seeded ${role} account: ${username.toLowerCase()}`);
}

export async function seedUsers(): Promise<void> {
  const specs: SeedSpec[] = [
    { role: "admin", username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD },
    { role: "doctor", username: process.env.DOCTOR_USERNAME, password: process.env.DOCTOR_PASSWORD },
    { role: "nurse", username: process.env.NURSE_USERNAME, password: process.env.NURSE_PASSWORD },
    { role: "intake", username: process.env.INTAKE_USERNAME, password: process.env.INTAKE_PASSWORD },
  ];

  const configured = specs.filter((s) => s.username && s.password);

  if (configured.length > 0) {
    for (const s of configured) {
      await upsertUser(s.role, s.username as string, s.password as string);
    }
    return;
  }

  // Nothing configured.
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "⚠️  No staff credentials configured (e.g. DOCTOR_USERNAME/DOCTOR_PASSWORD). " +
        "No accounts seeded — set them in the environment to enable login."
    );
    return;
  }

  // Development convenience accounts — NOT for production use.
  console.warn("⚠️  Seeding DEV staff accounts (doctor/nurse/intake/admin). Do NOT use in production.");
  await upsertUser("admin", "admin", "admin12345");
  await upsertUser("doctor", "doctor", "doctor12345");
  await upsertUser("nurse", "nurse", "nurse12345");
  await upsertUser("intake", "intake", "intake12345");
}
