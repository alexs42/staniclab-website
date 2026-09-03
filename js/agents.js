/**
 * Stanic Lab Website — JSON-LD Structured Data
 * Generates and injects Schema.org markup from data.js
 */

(function() {
  'use strict';

  if (typeof LAB_DATA === 'undefined') return;

  function injectJsonLd(data) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  // Organization schema
  injectJsonLd({
    '@context': 'https://schema.org',
    '@type': 'ResearchOrganization',
    name: LAB_DATA.lab.fullName,
    alternateName: LAB_DATA.lab.name,
    description: LAB_DATA.lab.tagline,
    url: window.location.origin,
    parentOrganization: {
      '@type': 'EducationalOrganization',
      name: LAB_DATA.lab.institution,
      department: {
        '@type': 'Organization',
        name: LAB_DATA.lab.department
      }
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '1111 Highland Ave',
      addressLocality: 'Madison',
      addressRegion: 'WI',
      postalCode: '53705',
      addressCountry: 'US'
    },
    member: [
      {
        '@type': 'Person',
        name: LAB_DATA.pi.name,
        jobTitle: LAB_DATA.pi.title,
        sameAs: Object.values(LAB_DATA.pi.links)
      },
      ...LAB_DATA.team.senior.map(m => ({
        '@type': 'Person',
        name: m.name,
        jobTitle: m.role
      })),
      ...LAB_DATA.team.graduate.map(m => ({
        '@type': 'Person',
        name: m.name,
        jobTitle: m.role
      }))
    ],
    knowsAbout: LAB_DATA.themes.map(t => t.title),
    funding: LAB_DATA.grants.map(g => ({
      '@type': 'Grant',
      identifier: g.number,
      funder: { '@type': 'Organization', name: `NIH ${g.institute}` }
    }))
  });

  // WebSite schema
  injectJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${LAB_DATA.lab.name} — ${LAB_DATA.lab.institution}`,
    url: window.location.origin,
    description: LAB_DATA.lab.tagline
  });

  // BreadcrumbList
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const breadcrumbs = [
    { name: 'Home', url: 'index.html' }
  ];

  const pageNames = {
    'people.html': 'People',
    'research.html': 'Research',
    'news.html': 'News'
  };

  if (pageNames[page]) {
    breadcrumbs.push({ name: pageNames[page], url: page });
  }

  injectJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${window.location.origin}/${item.url}`
    }))
  });

})();
