// Shared credential loading for the maintenance scripts.
//
// Nothing is hardcoded: every script reads SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY from the environment (or a local .env file that is
// git-ignored), and fails loudly rather than falling back to a baked-in key.

import fs from 'node:fs';
import path from 'node:path';

let loaded = false;

/** Loads .env from the repo root, without overwriting real environment values. */
function loadDotEnv() {
  if (loaded) return;
  loaded = true;
  for (const name of ['.env', '.env.local']) {
    const file = path.resolve(process.cwd(), name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!match) continue;
      const key = match[1];
      if (process.env[key] !== undefined) continue;
      process.env[key] = (match[2] || '').trim().replace(/^["']|["']$/g, '');
    }
  }
}

export function requireEnv(name) {
  loadDotEnv();
  const value = (process.env[name] || '').trim();
  if (!value) {
    console.error(
      `\nMissing ${name}.\n\n` +
      `Set it before running this script, for example:\n` +
      `  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node ${process.argv[1] || 'script.mjs'}\n\n` +
      `or put it in a .env file in the project root (.env is git-ignored).\n`,
    );
    process.exit(1);
  }
  return value;
}

export function supabaseUrl() { return requireEnv('SUPABASE_URL'); }
export function serviceKey() { return requireEnv('SUPABASE_SERVICE_ROLE_KEY'); }
export function anonKey() { return requireEnv('SUPABASE_ANON_KEY'); }
