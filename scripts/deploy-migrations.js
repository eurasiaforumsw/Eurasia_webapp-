#!/usr/bin/env node
/**
 * Backwards-compatible entry point for schema deployment.
 * The project runs on Neon; use the atomic migration runner in push-schema.js.
 */
const { pushSchema } = require('./push-schema.js');

pushSchema().catch((error) => {
  const suffix = error.migration ? ` (${error.migration})` : '';
  console.error(`Schema deployment failed${suffix}: ${error.message}`);
  process.exitCode = 1;
});
