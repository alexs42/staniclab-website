/** Quiet, cached department additions rendered exactly like stored news. */
(function() {
  'use strict';

  const CACHE_KEY = 'staniclab.uwnews.live';
  const MAX_AGE = 12 * 60 * 60 * 1000;

  async function refresh() {
    const news = window.UwNewsShared;
    if (!news || typeof LAB_DATA === 'undefined' || !window.UW_NEWS_READY) return;
    // The static render must finish first, so it cannot overwrite live additions.
    const stored = await window.UW_NEWS_READY;
    if (!stored) return;
    const knownLinks = LAB_DATA.labNews.map(item => item.sourceUrl).filter(Boolean);
    function merge(articles) {
      const additions = news.mergeArticles(stored, articles, knownLinks);
      if (additions.length) window.renderUwNews(additions.concat(stored));
    }
    function save(articles, fetchedAt) {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt, articles })); }
      catch (_) { /* Storage can be unavailable or full. */ }
    }
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      const age = cached && Date.now() - cached.fetchedAt;
      if (cached && Number.isFinite(cached.fetchedAt) && age >= 0 && age < MAX_AGE &&
          Array.isArray(cached.articles) && cached.articles.every(news.isArticle)) {
        merge(cached.articles);
        return;
      }
    } catch (_) { /* A missing/invalid cache is just a cache miss. */ }

    const fetchedAt = Date.now();
    // Cache an empty attempt too: failures must not cause another request on reload.
    save([], fetchedAt);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(news.SOURCE_URL, { signal: controller.signal });
      if (!response.ok) throw new Error('Department news unavailable');
      const fetched = news.parseDepartmentPage(await response.text());
      if (!fetched.length) throw new Error('No department news cards');
      const additions = news.mergeArticles(stored, fetched, knownLinks);
      save(additions, fetchedAt);
      merge(additions);
    } finally { clearTimeout(timeout); }
  }

  refresh().catch(() => { /* Offline, CSP and malformed responses leave stored news intact. */ });
})();
