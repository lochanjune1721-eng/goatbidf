-- GOAT.lol — the 22 contenders added when the boards were reordered
-- to open with the chosen pair. Everyone else already exists and is untouched.
--
-- Safe to run more than once: a slug that is already there is skipped, and no
-- existing row's id, money or photo is changed.

insert into people (slug, name, category_id, created_at)
select v.slug, v.name, c.id, now() + (v.ord * interval '1 millisecond')
  from (values
  ('dhyan-chand', 'Dhyan Chand', 'greatest-hockey-player', 1),
  ('lance-armstrong', 'Lance Armstrong', 'greatest-cyclist', 0),
  ('tom-cruise', 'Tom Cruise', 'greatest-hollywood-actor', 1),
  ('angelina-jolie', 'Angelina Jolie', 'greatest-hollywood-actress', 0),
  ('lee-min-ho', 'Lee Min-ho', 'greatest-korean-actor', 0),
  ('titanic', 'Titanic', 'greatest-film', 1),
  ('charlie-chaplin', 'Charlie Chaplin', 'greatest-comedian', 0),
  ('kevin-hart', 'Kevin Hart', 'greatest-comedian', 1),
  ('taylor-swift-2', 'Taylor Swift', 'greatest-singer', 1),
  ('travis-barker', 'Travis Barker', 'greatest-drummer', 1),
  ('j-k-rowling', 'J.K. Rowling', 'greatest-novelist', 1),
  ('king-arthur', 'King Arthur', 'greatest-king', 1),
  ('julius-caesar-7', 'Julius Caesar', 'greatest-emperor', 1),
  ('salahuddin', 'Salahuddin', 'greatest-sultan', 0),
  ('saladin-7', 'Saladin', 'greatest-caliph', 0),
  ('julius-caesar-8', 'Julius Caesar', 'greatest-roman-emperor', 0),
  ('kublai-khan-2', 'Kublai Khan', 'greatest-chinese-emperor', 1),
  ('michael-flatley', 'Michael Flatley', 'greatest-dancer', 1),
  ('linus-tech-tips', 'Linus Tech Tips', 'greatest-tech-creator', 1),
  ('james-bond-2', 'James Bond', 'greatest-spy', 0),
  ('ford-model-t', 'Ford Model T', 'greatest-car', 0),
  ('toyota-corolla', 'Toyota Corolla', 'greatest-car', 1)
  ) as v(slug, name, board_slug, ord)
  join categories c on c.slug = v.board_slug
on conflict (slug) do nothing;
