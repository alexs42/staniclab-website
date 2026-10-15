/** Quiet, cached PubMed additions rendered exactly like curated publications. */
(function() {
  'use strict';

  const CACHE_KEY = 'staniclab.pubmed.live';
  const MAX_AGE = 24 * 60 * 60 * 1000;

  async function refresh() {
    const pubmed = window.PubMedShared;
    if (!pubmed || typeof LAB_DATA === 'undefined') return;
    function merge(entries) {
      const additions = entries.filter(entry => !LAB_DATA.publications.some(stored => stored.pmid === entry.pmid));
      if (!additions.length) return;
      LAB_DATA.publications = pubmed.mergePublications(LAB_DATA.publications, additions);
      window.renderPublicationList();
      window.renderThemeKeyPapers();
    }
    function save(entries) {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), entries })); }
      catch (_) { /* Storage can be unavailable or full. */ }
    }
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      const age = cached && Date.now() - cached.fetchedAt;
      if (cached && Number.isFinite(cached.fetchedAt) && age >= 0 && age < MAX_AGE &&
          Array.isArray(cached.entries) && cached.entries.every(pubmed.isPublication)) {
        merge(cached.entries);
        return;
      }
    } catch (_) { /* A missing/invalid cache is just a cache miss. */ }

    async function request(endpoint, params) {
      const url = new URL(endpoint, pubmed.BASE_URL);
      url.search = new URLSearchParams({ db: 'pubmed', retmode: 'json', ...params });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('PubMed unavailable');
        return await response.json();
      } finally { clearTimeout(timeout); }
    }

    const ids = pubmed.readSearch(await request('esearch.fcgi', {
      // E-utilities calls this "pub date"; "pubdate" is the website's spelling
      // and ESearch rejects it with an "Unknown sort schema" warning.
      term: pubmed.QUERY, retmax: '300', sort: 'pub date'
    }));
    const storedIds = new Set(LAB_DATA.publications.map(publication => publication.pmid));
    const missing = ids.filter(id => !storedIds.has(id)).slice(0, 100);
    if (!missing.length) { save([]); return; }
    // Only two requests per load; space them below NCBI's 3 requests/sec limit.
    await new Promise(resolve => setTimeout(resolve, 350));
    const records = pubmed.readSummaries(await request('esummary.fcgi', { id: missing.join(',') }), missing);
    const { entries } = pubmed.buildEntries(records, LAB_DATA.publications);
    merge(entries);
    save(entries);
  }

  refresh().catch(() => { /* Offline, CSP, rate limits and malformed responses leave stored data intact. */ });
})();
