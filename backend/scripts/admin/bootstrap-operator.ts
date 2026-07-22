/**
 * CLI: npm run admin:bootstrap
 */

import { createArgon2PasswordHasher } from '../../src/infrastructure/services/argon2-password-hasher.js';
import { createOperatorRepository } from '../../src/infrastructure/repositories/operator-repository.js';
import { ensureBootstrapOperator } from '../../prisma/seed/ensure-bootstrap-operator.js';

async function main(): Promise<void> {
  const result = await ensureBootstrapOperator(
    createOperatorRepository(),
    createArgon2PasswordHasher(),
    process.env,
  );
  if (result.created) {
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
  } else {
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
