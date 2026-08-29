/* Generates sql/seed.sql from scripts/goat-data.js.
 *   node scripts/make-seed-sql.mjs
 *
 * The output needs no network, no Wikidata and no photo pipeline — paste it
 * into the Supabase SQL editor straight after sql/schema.sql.
 */
import { BOARDS, BOARD_COUNT, PERSON_COUNT } from './goat-data.js';
import { writeFileSync } from 'node:fs';

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";

const catRows = BOARDS.map((b, i) =>
  `  (${q(b.slug)}, ${q(b.name)}, ${q(b.group)}, ${i})`).join(',\n');

/* Everyone starts at $0, so the ranking rule (total_cents desc,
   first_backed_at asc, created_at asc) falls all the way through to
   created_at. Left identical for every row, the board renders in whatever
   order Postgres feels like. Spacing created_at by the curated position makes
   that final tiebreak the hand-picked order instead of an arbitrary one --
   nobody is pre-ranked, every total is still zero, and the first $1 still
   takes #1. */
const peopleRows = [];
let ordinal = 0;
for (const b of BOARDS) {
  for (let i = 0; i < b.people.length; i++) {
    peopleRows.push(`  (${q(b.slugs[i])}, ${q(b.people[i])}, ${q(b.slug)}, ${ordinal++})`);
  }
}

const sql = `-- GOAT.lol — the boards and their contenders.
-- Generated from scripts/goat-data.js by scripts/make-seed-sql.mjs.
-- Do not edit by hand; edit goat-data.js and regenerate.
--
-- ${BOARD_COUNT} boards, ${PERSON_COUNT} people. Run this straight after sql/schema.sql.
-- No network, no Wikidata, no photo pipeline.
--
-- Everyone starts at $0 and nobody is pre-ranked: the first $1 on a board
-- takes #1. Photos are absent by design for now — the card falls back to
-- initials in the display face, which is a deliberate part of the design.
--
-- Safe to re-run. Existing rows keep their id and their money; only the name
-- and grouping are refreshed, and totals are never touched.

insert into categories (slug, name, group_name, sort_order) values
${catRows}
on conflict (slug) do update
  set name = excluded.name,
      group_name = excluded.group_name,
      sort_order = excluded.sort_order;

insert into people (slug, name, category_id, created_at)
select v.slug, v.name, c.id, now() + (v.ord * interval '1 millisecond')
  from (values
${peopleRows.join(',\n')}
  ) as v(slug, name, cat_slug, ord)
  join categories c on c.slug = v.cat_slug
on conflict (slug) do update
  set name = excluded.name,
      category_id = excluded.category_id;
  -- created_at is deliberately not refreshed: on a re-run the boards keep the
  -- order they already have, and any money already staked is untouched.
`;

writeFileSync(new URL('../sql/seed.sql', import.meta.url), sql);
console.log(`sql/seed.sql written — ${BOARD_COUNT} boards, ${PERSON_COUNT} people`);
