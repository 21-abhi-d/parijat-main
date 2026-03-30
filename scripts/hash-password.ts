/**
 * Utility to generate a bcrypt hash for the admin password.
 * Usage: npx tsx scripts/hash-password.ts <your-password>
 * Copy the output into ADMIN_PASSWORD_HASH in your .env file.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npx tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log("\nAdd this to your .env:\n");
console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
