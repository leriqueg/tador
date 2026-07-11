/**
 * Load ensure-database-url then run the given command in the same process env.
 * Usage: node scripts/run-with-db-url.mjs npx prisma migrate deploy
 */

import './ensure-database-url.mjs';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/run-with-db-url.mjs <command> [args...]');
  process.exit(1);
}

const result = spawnSync(args[0], args.slice(1), {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
