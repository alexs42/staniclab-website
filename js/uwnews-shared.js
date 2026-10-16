/** Pure department news rules, shared by the browser and the Node sync. */
(function(root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.UwNewsShared = factory();
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';

  const SOURCE_ORIGIN = 'https://www.obgyn.wisc.edu';
  const SOURCE_URL = SOURCE_ORIGIN + '/categories/stanic-kostic-research-team';
  const ARTICLE_PREFIX = SOURCE_ORIGIN + '/ob-gyn-department-news/';
  const MAX_BYTES = 3 * 1024 * 1024;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  function decodeEntities(value) {
    const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
      ndash: '–', mdash: '—', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
      laquo: '«', raquo: '»', bull: '•', middot: '·', copy: '©', reg: '®', trade: '™' };
    return value.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, key) => {
      if (key[0] !== '#') return entities[key.toLowerCase()] || entity;
      const code = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
        ? String.fromCodePoint(code) : '';
    });
  }

  function plainText(value) {
    return decodeEntities(value)
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]*>/g, '').replace(/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
      .replace(/\s+/g, ' ').trim();
  }

  function articleLink(value) {
    try {
      if (typeof value !== 'string' || /[\s<>"'\\]/.test(value)) return '';
      const url = new URL(value, SOURCE_ORIGIN);
      return url.origin === SOURCE_ORIGIN && !url.username && !url.password &&
        url.href.startsWith(ARTICLE_PREFIX) && url.pathname.length > '/ob-gyn-department-news/'.length
        ? url.href : '';
    } catch (_) { return ''; }
  }

  function articleDate(text) {
    // Require a month and its year together; a year or month/day alone stays unknown.
    const match = text.match(new RegExp('\\b(' + MONTHS.join('|') +
      ')\\s+(?:\\d{1,2}(?:[–—-]\\d{1,2})?,?\\s+)?((?:19|20|21)\\d{2})\\b', 'i'));
    return match ? match[2] + '-' + String(MONTHS.findIndex(month =>
      month.toLowerCase() === match[1].toLowerCase()) + 1).padStart(2, '0') : '';
  }

  function parseDepartmentPage(html) {
    if (typeof html !== 'string' || html.length > MAX_BYTES || new TextEncoder().encode(html).length > MAX_BYTES) {
      throw new Error('Invalid or oversized department page');
    }
    const articles = [];
    // OrchardCMS card boundaries and fields match the existing admin scraper.
    const cards = html.split(/<div\s+class=["']card\s+p-2["']/i);
    for (const card of cards.slice(1)) {
      const titleMatch = card.match(/<h2\b[^>]*class=["'][^"']*\bpost-title\b[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i);
      if (!titleMatch) continue;
      const title = plainText(titleMatch[1]);
      const links = [...card.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)];
      const link = links.map(match => articleLink(decodeEntities(match[1]))).find(Boolean);
      if (!title || !link) continue;
      const excerptMatch = card.match(/<div\s+class=["']card-text["'][^>]*>([\s\S]*?)(?:<a\b|<\/div>)/i);
      const excerpt = plainText(excerptMatch ? excerptMatch[1] : '');
      const summary = excerpt.length > 220
        ? excerpt.slice(0, 219).replace(/\s+\S*$/, '').replace(/[.\s…]+$/, '') + '…'
        : excerpt.replace(/\.{3}$/, '…');
      articles.push({ title, link, summary, date: articleDate(title + ' ' + excerpt) });
    }
    return articles;
  }

  function isArticle(article) {
    return !!article && ['title', 'link', 'summary', 'date'].every(key => typeof article[key] === 'string') &&
      !!article.title.trim() && article.title === plainText(article.title) &&
      article.summary === plainText(article.summary) && article.link.startsWith(ARTICLE_PREFIX) &&
      articleLink(article.link) === article.link && /^(?:(?:19|20|21)\d{2}-(?:0[1-9]|1[0-2]))?$/.test(article.date);
  }

  function mergeArticles(stored, fetched, knownLinks) {
    const seen = new Set([...stored.map(article => article.link), ...knownLinks]);
    return fetched.filter(article => {
      if (!isArticle(article) || seen.has(article.link)) return false;
      seen.add(article.link);
      return true;
    });
  }

  return { SOURCE_URL, SOURCE_ORIGIN, parseDepartmentPage, mergeArticles, isArticle };
});
