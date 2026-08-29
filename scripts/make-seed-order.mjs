#!/usr/bin/env node
// Regenerates js/seed-order.js from scripts/goat-data.js.
// Run after editing the board lists:  node scripts/make-seed-order.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOARDS } from './goat-data.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ord = {};
for (const board of BOARDS) (board.slugs || []).forEach((slug, i) => { ord[slug] = i; });

const out = `/* Position of every contender within its board, taken from
 * scripts/goat-data.js. Used only to break ties: while a board is at $0
 * every row has the same total and the same (null) first_backed_at, so
 * without this the two faces shown are whatever order the database
 * happened to return.
 *
 * Regenerate with: node scripts/make-seed-order.mjs
 */
window.GOAT_SEED_ORDER = ${JSON.stringify(ord)};
`;

fs.writeFileSync(path.join(root, 'js/seed-order.js'), out);
console.log(`js/seed-order.js — ${Object.keys(ord).length} people across ${BOARDS.length} boards`);
