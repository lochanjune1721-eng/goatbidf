// The curated board list — 147 boards, each with its two contenders.
//
// Used as the home page's data when the database has not been seeded yet (or
// cannot be reached), so the site always shows the real boards rather than an
// empty page. Once scripts/seed_boards.mjs has run, the database wins and this
// is never touched.

window.BOARDS_FALLBACK = async () => {
  try {
    const response = await fetch('data/boards.json');
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || !Array.isArray(data.boards)) return null;

    const categories = data.boards.map((b) => ({
      id: 'board-' + b.slug,
      slug: b.slug,
      name: b.title,            // already "Greatest X"
      group_name: b.group,
      emoji: b.emoji,
      sort_order: b.sort_order,
    }));

    const people = [];
    for (const board of data.boards) {
      board.contenders.forEach((name, i) => {
        people.push({
          id: `board-${board.slug}-${i}`,
          slug: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
          name,
          category_id: 'board-' + board.slug,
          // No stored photo: /api/img resolves the portrait from the name.
          photo_path: null,
          total_cents: 0,
          first_backed_at: null,
        });
      });
    }
    return { categories, people };
  } catch (e) {
    console.warn('boards fallback failed', e);
    return null;
  }
};
