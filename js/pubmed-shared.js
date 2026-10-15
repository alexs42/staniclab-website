/** Pure PubMed conversion rules, shared by the browser and the Node sync. */
(function(root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.PubMedShared = factory();
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';

  const QUERY = '(stanic ak[au] OR stanic-kostic ak[au])';
  const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
  const THEME_RULES = [
    [/abruption|preeclampsia|endothelial|hypertens/i, 'pe'],
    [/\bPCOS\b|follicular|polycystic/i, 'pcos'],
    [/placenta|\bMRI\b|cotyledon|perfusion|mineralization|histopath/i, 'tissue'],
    // Match the curated early-career assignments: NKT biology is mfi;
    // GABA and the natural-T-cell characterization protocol are platforms.
    [/cytometry|pipeline|microphysiological|\bchip\b|single[- ]cell methods?|GABA|characterization and functional analysis/i, 'platforms'],
    [/decidua|\bNK\b|\bILC\w*|\bT[- ]cells?\b|\bT lymphocytes?\b|MAIT|trafficking|intravascular|\bi?NKT\b|\bCD1d\w*|natural (?:killer )?T\b/i, 'mfi']
  ];

  function cleanTitle(value) {
    const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—' };
    let title = String(value || '').replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, key) => {
      if (key[0] !== '#') return entities[key.toLowerCase()] || entity;
      const code = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    }).replace(/\s+/g, ' ').trim().replace(/\.+$/, '').trim();
    while (title.startsWith('[') && title.endsWith(']')) title = title.slice(1, -1).trim();
    return title.replace(/\.+$/, '').trim();
  }

  function normalizedTitle(title) {
    return cleanTitle(title).toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function publicationYear(record) {
    // Use the earliest available publication year (online appearance when it
    // precedes the journal issue), never the later indexing/Entrez year.
    const years = [record.epubdate, record.pubdate].map(date => {
      const match = String(date || '').match(/\b(?:18|19|20|21)\d{2}\b/);
      return match ? Number(match[0]) : null;
    }).filter(year => year !== null);
    return years.length ? Math.min(...years) : null;
  }

  function isPreprint(record) {
    return /\b(?:bioRxiv|medRxiv|Research\s+Square|SSRN)\b/i.test(record.source || record.journal || '') ||
      (record.pubtype || []).some(type => /^Preprint$/i.test(type));
  }

  function isErratum(record) {
    return /^(?:Corrigendum|Erratum|Correction|Retraction)\b/i.test(cleanTitle(record.title)) ||
      (record.pubtype || []).some(type => /^Published Erratum$/i.test(type));
  }

  function comparePublications(a, b) {
    return b.year - a.year || Number(b.pmid || 0) - Number(a.pmid || 0);
  }

  function mergePublications(stored, additions) {
    const seen = new Set(stored.map(publication => publication.pmid));
    return stored.concat(additions.filter(publication => {
      if (seen.has(publication.pmid)) return false;
      seen.add(publication.pmid);
      return true;
    })).sort(comparePublications);
  }

  function readSearch(data) {
    const result = data && data.esearchresult;
    if (data && data.error || !result || result.ERROR || !Array.isArray(result.idlist) ||
        !result.idlist.every(id => typeof id === 'string' && /^\d+$/.test(id))) {
      throw new Error('Invalid PubMed search response');
    }
    return [...new Set(result.idlist)];
  }

  function readSummaries(data, ids) {
    if (!data || data.error || !data.result || !Array.isArray(data.result.uids)) {
      throw new Error('Invalid PubMed summary response');
    }
    return ids.map(id => {
      const record = data.result[id];
      if (!record || record.error || record.uid !== id || typeof record.title !== 'string' ||
          !cleanTitle(record.title) || typeof record.source !== 'string' || !record.source ||
          !publicationYear(record) || !Array.isArray(record.authors) ||
          !record.authors.every(author => author && typeof author.name === 'string') ||
          !Array.isArray(record.pubtype) || !Array.isArray(record.articleids) ||
          (record.references !== undefined && !Array.isArray(record.references))) {
        throw new Error('Incomplete PubMed summary: ' + id);
      }
      return record;
    });
  }

  function buildEntries(records, stored) {
    const storedIds = new Set(stored.map(publication => publication.pmid));
    const journals = stored.concat(records).filter(record => !isPreprint(record) && !isErratum(record));
    const journalTitles = new Set(journals.map(record => normalizedTitle(record.title)));
    const journalIds = new Set(journals.map(record => String(record.uid || record.pmid)));
    // PubMed links versions even when the journal title changed (e.g. 42239306
    // -> 42696960: "pathology" became "histopathology"). Do not fuzzy-match titles.
    const replacedPreprints = new Set();
    journals.forEach(record => (record.references || []).forEach(reference => {
      if (/^Update of$/i.test(reference.reftype)) replacedPreprints.add(String(reference.pmid));
    }));
    const skipped = { alreadyStored: [], preprint: [], erratum: [] };
    const entries = [];
    const keptPreprints = [];
    const seen = new Set();
    records.forEach(record => {
      const pmid = String(record.uid);
      if (seen.has(pmid)) return;
      seen.add(pmid);
      if (storedIds.has(pmid)) { skipped.alreadyStored.push(pmid); return; }
      if (isErratum(record)) { skipped.erratum.push(pmid); return; }
      const preprint = isPreprint(record);
      const linkedJournal = (record.references || []).some(reference =>
        /^Update in$/i.test(reference.reftype) && journalIds.has(String(reference.pmid)));
      if (preprint && (journalTitles.has(normalizedTitle(record.title)) || linkedJournal || replacedPreprints.has(pmid))) {
        skipped.preprint.push(pmid);
        return;
      }
      const title = cleanTitle(record.title);
      const doi = record.articleids.find(id => id.idtype === 'doi');
      const rule = THEME_RULES.find(([pattern]) => pattern.test(title));
      entries.push({
        year: publicationYear(record), title,
        authors: record.authors.map(author => author.name).join(', '),
        journal: record.source, pmid, doi: doi ? doi.value : '', theme: rule ? rule[1] : ''
      });
      if (preprint) keptPreprints.push(pmid);
    });
    entries.sort(comparePublications);
    return { entries, summary: {
      fetched: seen.size, alreadyStored: skipped.alreadyStored.length, added: entries.length,
      skippedPreprint: skipped.preprint.length, skippedErratum: skipped.erratum.length
    }, skipped, keptPreprints };
  }

  function isPublication(entry) {
    return entry && Number.isInteger(entry.year) && entry.year >= 1800 && entry.year <= 2199 &&
      ['title', 'authors', 'journal', 'pmid', 'doi', 'theme'].every(key => typeof entry[key] === 'string') &&
      !!entry.title && !!entry.journal && /^\d+$/.test(entry.pmid);
  }

  return { QUERY, BASE_URL, cleanTitle, normalizedTitle, publicationYear, isPreprint,
    isErratum, comparePublications, mergePublications, readSearch, readSummaries, buildEntries, isPublication };
});
