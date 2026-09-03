/** Safe rendering for research.html. */
(function() {
  'use strict';

  const html = window.escapeHtml;
  const href = value => html(window.safeHref(value));

  const pubMap = {};
  LAB_DATA.publications.forEach(publication => {
    if (publication.pmid) pubMap[publication.pmid] = publication;
  });
  const grantMap = {};
  LAB_DATA.grants.forEach(grant => { grantMap[grant.number] = grant; });

  document.getElementById('themes-deep').innerHTML = LAB_DATA.themes.map(theme => {
    const papers = (theme.keyPapers || []).map(pmid => {
      const publication = pubMap[pmid];
      if (!publication) return '';
      const note = theme.keyPaperNotes && theme.keyPaperNotes[pmid]
        ? ' · ' + html(theme.keyPaperNotes[pmid])
        : '';
      return '<li><a href="https://pubmed.ncbi.nlm.nih.gov/' + encodeURIComponent(pmid) + '/" target="_blank" rel="noopener">' +
        html(publication.title) + '</a> <span class="pub-meta">' + html(publication.journal) + ' (' + html(publication.year) + ')' + note + '</span></li>';
    }).filter(Boolean).join('');

    const grants = (theme.grants || []).map(number => {
      const grant = grantMap[number];
      if (!grant) return '<li>' + html(number) + '</li>';
      return '<li>' + html(grant.number) + ' (' + html(grant.institute) + ', ' + html(grant.role) + ') — ' + html(grant.period) + '</li>';
    }).join('');

    return '<div class="theme-deep" id="' + html(theme.id) + '">' +
      (theme.image ? '<div class="theme-deep__img"><img src="' + href(theme.image) + '" alt="' + html(theme.title) + '" loading="lazy"></div>' : '') +
      '<div class="theme-deep__content">' +
        '<h3 style="color:' + window.safeColor(theme.color) + '">' + html(theme.title) + '</h3>' +
        '<p class="subtitle">' + html(theme.subtitle) + '</p>' +
        '<p class="detail">' + html(theme.detail || theme.summary) + '</p>' +
        (papers ? '<div class="theme-papers"><h4>Key Publications</h4><ul>' + papers + '</ul></div>' : '') +
        (grants ? '<div class="theme-grants"><h4>Funding</h4><ul>' + grants + '</ul></div>' : '') +
      '</div>' +
    '</div>';
  }).join('');

  document.getElementById('model-grid').innerHTML = LAB_DATA.models.map(model => `
    <div class="model-card">
      <h4>${html(model.name)}</h4>
      <p class="strength">${html(model.strength)}</p>
      <p class="use">${html(model.use)}</p>
      ${model.partner ? '<p class="partner">' + html(model.partner) + '</p>' : ''}
    </div>
  `).join('');

  document.getElementById('methods-grid').innerHTML = LAB_DATA.methods
    .map(method => `<span class="method-pill">${html(method)}</span>`).join('');

  document.getElementById('pub-list').innerHTML = LAB_DATA.publications.map(publication => {
    const links = [];
    if (publication.pmid) {
      links.push('<a href="https://pubmed.ncbi.nlm.nih.gov/' + encodeURIComponent(publication.pmid) + '/" target="_blank" rel="noopener">PubMed</a>');
    }
    if (publication.doi) {
      links.push('<a href="https://doi.org/' + encodeURIComponent(publication.doi) + '" target="_blank" rel="noopener">DOI</a>');
    }
    return '<div class="pub-item" data-pmid="' + html(publication.pmid || '') + '">' +
      '<p class="pub-year">' + html(publication.year) + '</p>' +
      '<p class="pub-title">' + html(publication.title) + '</p>' +
      '<p class="pub-authors">' + html(publication.authors) + '</p>' +
      '<p class="pub-journal">' + html(publication.journal) + (links.length ? ' · ' + links.join(' · ') : '') + '</p>' +
    '</div>';
  }).join('');

  document.getElementById('grant-tbody').innerHTML = LAB_DATA.grants.map(grant => `
    <tr><td>${html(grant.number)}</td><td>${html(grant.institute)}</td><td>${html(grant.role)}</td><td>${html(grant.period)}</td></tr>
  `).join('');

  document.getElementById('society-list').innerHTML = LAB_DATA.societies.map(society => `
    <span class="society-item"><abbr title="${html(society.name)}">${html(society.abbrev)}</abbr> ${html(society.name)}</span>
  `).join('');
})();
