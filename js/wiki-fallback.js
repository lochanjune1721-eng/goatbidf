// Fallback when Supabase people is empty — loads data/wikidata-people.json (66 cats, 944 people) as static demo
window.WIKI_FALLBACK = async () => {
  try {
    const r = await fetch('data/wikidata-people.json');
    if(!r.ok) return null;
    const j = await r.json();
    // j is {slug: {category, people:[...]}}
    const people = [];
    for(const slug of Object.keys(j)){
      const cat = j[slug].category;
      for(const p of j[slug].people){
        people.push({
          id: 'fallback-'+slug+'-'+p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
          slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,24)+'-'+Math.random().toString(36).slice(2,4),
          name: p.name,
          blurb: p.description,
          wikipedia_url: p.wikipedia,
          photo_path: p.image,
          total_cents: 0,
          category_slug: slug,
          category_name: cat.name,
          group_name: cat.group
        });
      }
    }
    return { categories: Object.values(j).map(v=>v.category), people };
  } catch(e){ console.warn('fallback failed', e); return null; }
};
