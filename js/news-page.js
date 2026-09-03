/** Safe rendering for news.html. */
(function() {
  'use strict';

  const html = window.escapeHtml;
  const href = value => html(window.safeHref(value));

  document.getElementById('lab-news-list').innerHTML = LAB_DATA.labNews.map(item => `
    <div class="lab-news-item">
      <span class="lab-news-date">${html(item.date)}</span>
      <div>
        <h4>${html(item.title)}</h4>
        <p>${html(item.description)}</p>
        <div class="news-tags">${(item.tags || []).map(tag => `<span class="news-tag">${html(tag)}</span>`).join('')}</div>
      </div>
    </div>
  `).join('');

  const galleryGrid = document.getElementById('gallery-grid');
  if (galleryGrid && LAB_DATA.gallery.length > 0) {
    galleryGrid.innerHTML = LAB_DATA.gallery.map(photo => `
      <figure class="gallery-item">
        <img src="${href(photo.src)}" alt="${html(photo.caption)}" loading="lazy">
        <figcaption>${html(photo.caption)}</figcaption>
      </figure>
    `).join('');
  }

  fetch('data/uw-news-cache.json')
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (!data || !Array.isArray(data.articles) || data.articles.length === 0) return;
      const container = document.getElementById('uw-news-container');
      container.innerHTML = '<div class="uw-news-grid">' + data.articles.map(article => `
        <div class="uw-news-card">
          <p class="date">${html(article.date || '')}</p>
          <h4><a href="${href(article.link)}" target="_blank" rel="noopener">${html(article.title)}</a></h4>
          <p>${html(article.summary || '')}</p>
        </div>
      `).join('') + '</div>';
    })
    .catch(() => {});
})();
