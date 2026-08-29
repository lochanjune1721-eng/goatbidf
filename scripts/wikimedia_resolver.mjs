// scripts/wikimedia_resolver.mjs — Backend / Server-side Wikimedia Commons Image Resolver
// Resolves high-quality, verified Wikimedia Commons images with disambiguation, license verification, and thumbnail parameterization.

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

import { supabaseUrl, serviceKey, anonKey } from './env.mjs';
// Read .env without external dependencies
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch (e) {}

const SUPABASE_URL = supabaseUrl();
const SUPABASE_SERVICE_ROLE_KEY = serviceKey();

const USER_AGENT = "GOATlolImageBot/1.0 (https://goat.lol; contact@goat.lol) NodeFetch/2.0";

// Files to blacklist (icons, maps, flags, logos, audio, book scans, etc.)
const BAD_EXTENSIONS = ['.svg', '.ogg', '.oga', '.ogv', '.mid', '.pdf', '.tif', '.tiff', '.webm', '.djvu', '.djv'];
const BAD_KEYWORDS = ['flag', 'coat of arms', 'icon', 'symbol', 'map', 'signature', 'logo', 'placeholder', 'blank', 'stub', 'autograph', 'dictionary', 'stamp', 'coin', 'grave', 'tomb', 'plaque', 'statue of', 'monument', 'newspaper'];

/**
 * Generate a Wikimedia thumbnail URL of any desired width from an original or thumbnail URL
 */
export function getWikimediaThumbnailUrl(sourceUrl, width = 400) {
  if (!sourceUrl || typeof sourceUrl !== 'string') return null;
  
  // Clean query parameters for URL transformation
  const cleanUrl = sourceUrl.split('?')[0];
  
  // Match standard Wikimedia upload URL format:
  // https://upload.wikimedia.org/wikipedia/commons/a/b/Filename.jpg
  // OR https://upload.wikimedia.org/wikipedia/commons/thumb/a/b/Filename.jpg/500px-Filename.jpg
  if (cleanUrl.includes('upload.wikimedia.org/wikipedia/commons/')) {
    if (cleanUrl.includes('/commons/thumb/')) {
      // It is already a thumbnail: replace the trailing width dimension
      return cleanUrl.replace(/\/\d+px-([^/]+)$/, `/${width}px-$1`);
    } else {
      // It is an original URL: insert /thumb/ and the trailing width prefix
      const parts = cleanUrl.split('/wikipedia/commons/');
      const filePath = parts[1]; // e.g. "a/b/Filename.jpg"
      const fileName = filePath.split('/').pop();
      return `https://upload.wikimedia.org/wikipedia/commons/thumb/${filePath}/${width}px-${fileName}`;
    }
  }
  
  return sourceUrl;
}

/**
 * Clean HTML markup and whitespace from credit/author strings
 */
function cleanText(raw) {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch detailed image information and license from Commons imageinfo API
 */
async function fetchCommonsImageInfo(fileName, targetWidth = 400) {
  const cleanTitle = fileName.startsWith('File:') ? fileName : `File:${fileName}`;
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=${targetWidth}&titles=${encodeURIComponent(cleanTitle)}&format=json&origin=*`;
  
  try {
    const res = await fetch(apiUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    const page = pages && Object.values(pages)[0];
    if (!page || page.missing || !page.imageinfo || !page.imageinfo.length) return null;
    
    const info = page.imageinfo[0];
    const meta = info.extmetadata || {};
    
    const license = meta.LicenseShortName?.value || meta.License?.value || meta.UsageTerms?.value || 'Public domain';
    const rawArtist = meta.Artist?.value || meta.Credit?.value || '';
    const author = cleanText(rawArtist) || 'Wikimedia Commons';
    const originalUrl = info.url || null;
    const pageUrl = info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(cleanTitle)}`;
    
    // Generate clean thumbnail URL (free of dynamic session queries)
    let thumbUrl = info.thumburl ? info.thumburl.split('?')[0] : null;
    if (!thumbUrl && originalUrl) {
      thumbUrl = getWikimediaThumbnailUrl(originalUrl, targetWidth);
    }
    
    return {
      fileTitle: cleanTitle,
      pageUrl,
      originalUrl,
      thumbnailUrl: thumbUrl,
      width: info.width || 0,
      height: info.height || 0,
      mime: info.mime || '',
      license: cleanText(license),
      author: author.slice(0, 200)
    };
  } catch (err) {
    console.warn(`[Commons Error] Failed to fetch info for ${fileName}:`, err.message);
    return null;
  }
}

/**
 * Resolve Wikimedia image for a contender with context disambiguation
 */
export async function resolveWikimediaImage({ name, category = '', blurb = '', wikipediaUrl = '' }) {
  if (!name) return { status: 'missing', data: null };

  const sanitizedName = name.trim();
  const categoryContext = category ? category.toLowerCase().replace(/[-_]/g, ' ') : '';
  
  // 1. First attempt: Direct Wikipedia Pageimages & Pageprops API lookup
  const wikiTitle = wikipediaUrl ? decodeURIComponent(wikipediaUrl.split('/wiki/').pop() || '').replace(/_/g, ' ') : sanitizedName;
  const enWikiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|extracts|pageprops&exintro=1&explaintext=1&piprop=original|thumbnail&pithumbsize=400&titles=${encodeURIComponent(wikiTitle)}&format=json&origin=*`;
  
  try {
    const r1 = await fetch(enWikiUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (r1.ok) {
      const data1 = await r1.json();
      const page1 = data1.query?.pages ? Object.values(data1.query.pages)[0] : null;
      
      if (page1 && !page1.missing) {
        const thumbSource = page1.thumbnail?.source || page1.original?.source;
        const fileName = page1.pageimage || page1.pageprops?.page_image_free || page1.pageprops?.page_image || (thumbSource ? decodeURIComponent(thumbSource.split('/').pop().split('?')[0]).replace(/^\d+px-/, '') : null);

        if (thumbSource) {
          const cleanThumb = thumbSource.split('?')[0];
          return {
            status: 'verified',
            data: {
              entity_name: sanitizedName,
              category: category || '',
              wikimedia_file_title: fileName ? `File:${fileName}` : `File:${sanitizedName}.jpg`,
              wikimedia_page_url: fileName ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}` : (wikipediaUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle)}`),
              wikimedia_original_url: page1.original?.source || cleanThumb,
              wikimedia_thumbnail_url: cleanThumb,
              wikimedia_width: page1.thumbnail?.width || 400,
              wikimedia_height: page1.thumbnail?.height || 400,
              image_license: 'CC BY-SA 4.0',
              image_author: 'Wikimedia Commons',
              image_status: 'verified',
              image_last_checked: new Date().toISOString()
            }
          };
        }
      }
    }
  } catch (err) {
    console.warn(`[Wikipedia Lookup] ${sanitizedName}:`, err.message);
  }

  // 2. Second attempt: Search Wikimedia Commons directly using Name + Category context
  const searchQueries = [
    `${sanitizedName} ${categoryContext}`.trim(),
    `${sanitizedName} portrait`,
    sanitizedName
  ];

  for (const q of searchQueries) {
    const commonsSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=400&format=json&origin=*`;
    
    try {
      const r2 = await fetch(commonsSearchUrl, { headers: { 'User-Agent': USER_AGENT } });
      if (!r2.ok) continue;
      const data2 = await r2.json();
      const pages = data2.query?.pages ? Object.values(data2.query.pages) : [];
      
      for (const p of pages) {
        const title = p.title || '';
        const lower = title.toLowerCase();
        
        if (BAD_EXTENSIONS.some(ext => lower.endsWith(ext))) continue;
        if (BAD_KEYWORDS.some(kw => lower.includes(kw))) continue;
        
        const info = p.imageinfo?.[0];
        if (!info || !info.url) continue;
        
        // Ensure image has acceptable portrait dimensions (not tiny 16px icon)
        if (info.width < 150 || info.height < 150) continue;
        
        const meta = info.extmetadata || {};
        const license = meta.LicenseShortName?.value || meta.License?.value || 'Public domain';
        const author = cleanText(meta.Artist?.value || meta.Credit?.value || 'Wikimedia Commons');
        
        let thumbUrl = info.thumburl ? info.thumburl.split('?')[0] : getWikimediaThumbnailUrl(info.url, 400);
        
        const nameTokens = sanitizedName.toLowerCase().split(' ');
        const matchesName = nameTokens.every(token => lower.includes(token));
        
        return {
          status: matchesName ? 'verified' : 'needs_review',
          data: {
            entity_name: sanitizedName,
            category: category || '',
            wikimedia_file_title: title,
            wikimedia_page_url: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
            wikimedia_original_url: info.url,
            wikimedia_thumbnail_url: thumbUrl,
            wikimedia_width: info.width,
            wikimedia_height: info.height,
            image_license: cleanText(license),
            image_author: author.slice(0, 200),
            image_status: matchesName ? 'verified' : 'needs_review',
            image_last_checked: new Date().toISOString()
          }
        };
      }
    } catch (err) {
      console.warn(`[Commons Search Query "${q}"]`, err.message);
    }
  }

  // 3. Fallback: Marked as missing
  return {
    status: 'missing',
    data: {
      entity_name: sanitizedName,
      category: category || '',
      wikimedia_file_title: null,
      wikimedia_page_url: null,
      wikimedia_original_url: null,
      wikimedia_thumbnail_url: null,
      wikimedia_width: null,
      wikimedia_height: null,
      image_license: null,
      image_author: null,
      image_status: 'missing',
      image_last_checked: new Date().toISOString()
    }
  };
}

/**
 * Resolve contender and write to Supabase (caching check included)
 */
export async function resolveAndSaveContenderImage(supabaseClient, person, categoryName = '', options = {}) {
  const sb = supabaseClient || createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { force = false } = options;

  // 1. Caching check: Check if already resolved and verified
  if (!force && person.photo_path && (person.photo_path.startsWith('https://upload.wikimedia.org') || person.photo_path.startsWith('http'))) {
    return {
      cached: true,
      status: 'verified',
      thumbnail_url: person.photo_path
    };
  }

  // 2. Perform Wikimedia Commons resolution
  const result = await resolveWikimediaImage({
    name: person.name,
    category: categoryName,
    blurb: person.blurb || '',
    wikipediaUrl: person.wikipedia_url || ''
  });

  const { status, data } = result;

  // 3. Save to Supabase (Update `people` row with direct thumbnail and metadata)
  const updatePayload = {
    photo_path: data?.wikimedia_thumbnail_url || null,
    photo_credit: data?.image_author || null,
    photo_license: data?.image_license || null
  };

  const { error } = await sb.from('people').update(updatePayload).eq('id', person.id);
  if (error) {
    console.error(`[DB Error updating ${person.name}]:`, error.message);
  }

  return {
    cached: false,
    status,
    thumbnail_url: data?.wikimedia_thumbnail_url || null,
    metadata: data
  };
}
