// GOAT.lol — config, Supabase client, auth and shared helpers.
//
// No keys live in this file. They are read from Vercel environment variables
// and served by /api/config, so rotating a key is a dashboard change plus a
// redeploy, never a code change.
//
// Every page does `await window.GOAT.ready` before touching the database.

(function () {
  const CONFIG_CACHE_KEY = 'goat_config_v1';

  // ---------------------------------------------------------------- helpers

  /** Escapes text before it goes anywhere near innerHTML. */
  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Escapes text used inside an HTML attribute value. */
  function escAttr(value) {
    return esc(value).replace(/[\r\n]+/g, ' ');
  }

  function initials(name) {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  const PLATFORMS = {
    instagram: { label: 'Instagram', url: (h) => `https://instagram.com/${encodeURIComponent(h)}` },
    x: { label: 'X', url: (h) => `https://x.com/${encodeURIComponent(h)}` },
    tiktok: { label: 'TikTok', url: (h) => `https://tiktok.com/@${encodeURIComponent(h)}` },
    youtube: { label: 'YouTube', url: (h) => `https://youtube.com/@${encodeURIComponent(h)}` },
    facebook: { label: 'Facebook', url: (h) => `https://facebook.com/${encodeURIComponent(h)}` },
    snapchat: { label: 'Snapchat', url: (h) => `https://snapchat.com/add/${encodeURIComponent(h)}` },
    twitch: { label: 'Twitch', url: (h) => `https://twitch.tv/${encodeURIComponent(h)}` },
    other: { label: 'Social', url: () => null },
  };

  function socialUrl(platform, handle) {
    const clean = String(handle || '').replace(/^@+/, '').trim();
    if (!clean) return null;
    const entry = PLATFORMS[platform];
    return entry ? entry.url(clean) : null;
  }

  function platformLabel(platform) {
    return PLATFORMS[platform] ? PLATFORMS[platform].label : 'Social';
  }

  window.GOAT = {
    esc,
    escAttr,
    initials,
    PLATFORMS,
    socialUrl,
    platformLabel,
    SUPABASE_URL: null,
    CURRENCY: 'USD',
    cents: (c) => `$${Math.round((c || 0) / 100).toLocaleString()}`,
    centsExact: (c) => `$${((c || 0) / 100).toFixed(2)}`,
    fmtAgo: (iso) => {
      if (!iso) return '—';
      const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (!Number.isFinite(s)) return '—';
      if (s < 60) return `${Math.max(0, s)}s ago`;
      const m = Math.floor(s / 60);
      if (m < 60) return `${m} min ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.floor(h / 24);
      return `${d}d ago`;
    },
    qs: (k) => new URLSearchParams(location.search).get(k),
    getPhotoUrl: (path) => {
      if (!path || typeof path !== 'string') return null;
      const trimmed = path.trim();
      if (!trimmed) return null;
      if (/^(https?:|data:)/.test(trimmed)) return trimmed;
      const base = window.GOAT.SUPABASE_URL;
      if (!base) return null;
      return `${base}/storage/v1/object/public/people/${trimmed.replace(/^\/+/, '')}`;
    },
  };

  // ----------------------------------------------------------------- config

  async function loadConfig() {
    // A cached copy keeps navigation instant; /api/config is also edge-cached.
    try {
      const cached = sessionStorage.getItem(CONFIG_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.supabaseUrl && parsed.supabaseAnonKey) return parsed;
      }
    } catch (e) { /* private mode, or a corrupt entry — just refetch */ }

    const response = await fetch('/api/config', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Config unavailable (${response.status})`);
    const config = await response.json();

    try {
      sessionStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));
    } catch (e) { /* not fatal */ }
    return config;
  }

  function showConfigError(message) {
    const banner = document.createElement('div');
    banner.setAttribute('role', 'alert');
    banner.style.cssText =
      'position:fixed;left:0;right:0;top:0;z-index:9999;padding:12px 16px;' +
      'background:#3a1c1c;color:#ffd9d9;font:14px/1.5 system-ui,sans-serif;text-align:center';
    banner.textContent = message;
    const mount = () => document.body && document.body.prepend(banner);
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount);
  }

  window.GOAT.ready = (async function init() {
    let config;
    try {
      config = await loadConfig();
    } catch (err) {
      showConfigError(
        'Site configuration could not be loaded. If you are the owner: set SUPABASE_URL and ' +
          'SUPABASE_ANON_KEY in your Vercel project settings, then redeploy.',
      );
      throw err;
    }

    if (!config.configured) {
      showConfigError(
        `Missing environment variables in Vercel: ${(config.missing || []).join(', ')}. ` +
          'Add them in Project → Settings → Environment Variables, then redeploy.',
      );
      throw new Error('Supabase is not configured');
    }

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      showConfigError('The Supabase library failed to load. Check your connection and refresh.');
      throw new Error('supabase-js not loaded');
    }

    window.GOAT.SUPABASE_URL = config.supabaseUrl;
    window.GOAT.CURRENCY = config.currency || 'USD';
    window.GOAT.PAYPAL_CLIENT_ID = config.paypalClientId || null;
    window.GOAT.PAYMENTS_ENABLED = Boolean(config.paymentsEnabled);
    window.GOAT.PAYPAL_ENV = config.paypalEnv || 'sandbox';

    window.supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    return window.GOAT;
  })();

  // ------------------------------------------------------------------- auth

  async function ensureUserRow() {
    await window.GOAT.ready;
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return null;

    let { data } = await window.supabaseClient
      .from('users').select('*').eq('id', user.id).maybeSingle();

    if (!data) {
      const display = user.user_metadata?.display_name || (user.email || '').split('@')[0];
      const anon = !!user.user_metadata?.is_anonymous;
      const { data: inserted } = await window.supabaseClient
        .from('users')
        .insert({ id: user.id, email: user.email, display_name: display, is_anonymous: anon })
        .select('*').maybeSingle();
      data = inserted;
    }
    return data;
  }
  window.ensureUserRow = ensureUserRow;

  async function refreshBalance() {
    const pill = document.getElementById('balance-pill');
    if (!pill) return;
    try {
      await window.GOAT.ready;
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      if (!user) {
        pill.innerHTML = '<a href="wallet.html">Sign in</a>';
        return;
      }
      const { data } = await window.supabaseClient
        .from('users').select('balance_cents').eq('id', user.id).maybeSingle();
      const balance = data ? data.balance_cents : 0;
      pill.innerHTML =
        `<b>$${Math.round((balance || 0) / 100)} credit</b> <a href="wallet.html">Add</a>`;
    } catch (e) {
      pill.innerHTML = '<a href="wallet.html">Sign in</a>';
    }
  }
  window.refreshBalance = refreshBalance;

  document.addEventListener('DOMContentLoaded', refreshBalance);
  window.GOAT.ready
    .then(() => window.supabaseClient.auth.onAuthStateChange(() => refreshBalance()))
    .catch(() => { /* the config banner already explains what is wrong */ });
})();
