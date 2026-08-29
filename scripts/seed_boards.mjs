#!/usr/bin/env node
// Seeds the 147 curated boards and their two contenders into Supabase.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed_boards.mjs
//   ...                                          node scripts/seed_boards.mjs --dry
//
// Safe to run more than once: categories and people are matched on slug, so a
// second run updates names rather than creating duplicates. Existing totals and
// bids are never touched.

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

function env(name) {
  // Allow a .env file in the project root as well as real environment values.
  for (const file of ['.env', '.env.local']) {
    const full = path.resolve(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = (m[2] || '').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  const value = (process.env[name] || '').trim();
  if (!value) {
    console.error(`\nMissing ${name}.\n\n  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node ${process.argv[1]}\n`);
    process.exit(1);
  }
  return value;
}

const DRY = process.argv.includes('--dry');
const data = JSON.parse(fs.readFileSync(new URL('../data/boards.json', import.meta.url), 'utf8'));

console.log(`${data.boards.length} boards across ${data.groups.length} groups`);
if (DRY) {
  for (const b of data.boards) console.log(`  ${b.title.padEnd(34)} [${b.group}]  ${b.contenders.join('  vs  ')}`);
  console.log('\n--dry: nothing written.');
  process.exit(0);
}

const supa = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

let cats = 0, added = 0, skipped = 0;

for (const board of data.boards) {
  // Category, matched on slug.
  const { data: existingCat } = await supa.from('categories')
    .select('id').eq('slug', board.slug).maybeSingle();

  let categoryId = existingCat?.id;
  if (categoryId) {
    await supa.from('categories')
      .update({ name: board.title, group_name: board.group, sort_order: board.sort_order })
      .eq('id', categoryId);
  } else {
    const { data: inserted, error } = await supa.from('categories')
      .insert({ slug: board.slug, name: board.title, group_name: board.group, sort_order: board.sort_order })
      .select('id').maybeSingle();
    if (error) { console.error('  category failed:', board.slug, error.message); continue; }
    categoryId = inserted.id;
  }
  cats++;

  // The two contenders. Totals are left alone if the person already exists.
  for (const name of board.contenders) {
    const slug = `${slugify(name)}-${board.slug}`.slice(0, 90);
    const { data: existing } = await supa.from('people')
      .select('id').eq('slug', slug).maybeSingle();

    if (existing) { skipped++; continue; }

    const { error } = await supa.from('people').insert({
      slug,
      category_id: categoryId,
      name,
      blurb: '',
      wikipedia_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/ /g, '_'))}`,
      // Left null on purpose: /api/img resolves the portrait from the name,
      // so there is nothing to keep in sync here.
      photo_path: null,
      total_cents: 0,
    });
    if (error) console.error('  person failed:', name, error.message);
    else added++;
  }
  process.stdout.write(`\r  ${cats}/${data.boards.length} boards`);
}

console.log(`\n\nDone. ${cats} boards, ${added} people added, ${skipped} already present.`);
