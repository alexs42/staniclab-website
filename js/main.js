/**
 * Stanic Lab Website — Main JS
 * Nav scroll behavior, smooth scroll, mobile menu, theme switcher
 */

(function() {
  'use strict';

  // ─── Security Helpers ──────────────────────────────────────
  function safeHref(url) {
    if (!url) return '#';
    try { const u = new URL(url, location.href); return ['http:', 'https:', 'mailto:'].includes(u.protocol) ? url : '#'; }
    catch { return '#'; }
  }
  function safeColor(c) { return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : '#666'; }

  // Expose for inline scripts in HTML pages
  window.safeHref = safeHref;
  window.safeColor = safeColor;

  // ─── Theme Switcher ─────────────────────────────────────────
  const VARIANTS = ['A', 'B', 'C', 'D'];
  const DEFAULT_VARIANT = 'B';

  function getVariant() {
    const params = new URLSearchParams(window.location.search);
    const v = (params.get('theme') || DEFAULT_VARIANT).toUpperCase();
    return VARIANTS.includes(v) ? v : DEFAULT_VARIANT;
  }

  function applyTheme(variant) {
    const link = document.getElementById('theme-css');
    if (link) {
      link.href = `css/variant-${variant}.css`;
    }
  }

  // ─── Scroll-based Nav ───────────────────────────────────────
  function initNav() {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;

    let ticking = false;

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          nav.classList.toggle('scrolled', window.scrollY > 60);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ─── Mobile Menu ────────────────────────────────────────────
  function initMobileMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.querySelector('span:nth-child(1)').style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
      toggle.querySelector('span:nth-child(2)').style.opacity = isOpen ? '0' : '1';
      toggle.querySelector('span:nth-child(3)').style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
    });

    // Close on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.querySelector('span:nth-child(1)').style.transform = '';
        toggle.querySelector('span:nth-child(2)').style.opacity = '1';
        toggle.querySelector('span:nth-child(3)').style.transform = '';
      });
    });
  }

  // ─── Smooth Scroll for Anchor Links ─────────────────────────
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const navHeight = document.querySelector('.site-nav')?.offsetHeight || 72;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  // ─── Active Nav Link ────────────────────────────────────────
  function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, {
      rootMargin: '-30% 0px -60% 0px'
    });

    sections.forEach(s => observer.observe(s));
  }

  // ─── Vanta.js Animated Hero Background ─────────────────────
  const VANTA_COLORS = {
    A: { bg: 0xF5F2ED, c1: 0x1B4332, c2: 0xB45309 },
    B: { bg: 0x0B0F14, c1: 0x22D3EE, c2: 0xF59E0B },
    C: { bg: 0xFAFBFC, c1: 0xC5050C, c2: 0x0D47A1 },
    D: { bg: 0x1C1A17, c1: 0xD4A853, c2: 0xC07040 }
  };

  function getEffect() {
    const params = new URLSearchParams(window.location.search);
    const e = (params.get('effect') || 'cells').toLowerCase();
    return ['cells', 'net', 'topology'].includes(e) ? e : 'cells';
  }

  // ─── Page identity ────────────────────────────────────────
  // Resolve the current page's file name from the URL path, so the maps below
  // work at any mount point: "/", "/index.html", "/lab/people.html", or the
  // GitHub Pages preview address "/staniclab-website/". A path with no file
  // name (a directory) is the home page.
  function currentPageFile() {
    const last = window.location.pathname.split('/').pop();
    return last && last.includes('.') ? last.toLowerCase() : 'index.html';
  }

  // ─── Per-Page Hero Images (shown after video fades) ───────
  const PAGE_HERO_IMAGES = {
    'index.html':    'images/hero/hero-A.png',
    'people.html':   'images/hero/hero-A-blend.png',
    'research.html': 'images/hero/hero-C-blend.png',
    'news.html':     'images/hero/hero-C.png'
  };

  function setPageHeroImage() {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;
    const src = PAGE_HERO_IMAGES[currentPageFile()];
    if (src) {
      // Override variant CSS hero image while keeping the gradient fallback
      heroBg.style.setProperty('background-image', `url('${src}')`, 'important');
      heroBg.style.backgroundSize = 'cover';
      heroBg.style.backgroundPosition = 'center';
      heroBg.style.backgroundRepeat = 'no-repeat';
    }
  }

  // ─── Video Hero Background ────────────────────────────────
  const HERO_VIDEOS = {
    video1: 'images/hero/hero-video-1.mp4',
    video2: 'images/hero/hero-video-2.mp4',
    video3: 'images/hero/hero-video-3.mp4'
  };

  // Per-page default videos (override with ?hero= param)
  const PAGE_VIDEOS = {
    'index.html':    'video2',  // Home: Reddish Placenta
    'people.html':   'video1',  // People: Bioluminescent Interface
    'research.html': 'video3'   // Research: Abstract Cosmic
  };

  function getHeroVideo() {
    const params = new URLSearchParams(window.location.search);
    const explicit = params.get('hero');
    if (explicit && HERO_VIDEOS[explicit]) return HERO_VIDEOS[explicit];

    // Auto-assign by page
    const key = PAGE_VIDEOS[currentPageFile()];
    if (key && HERO_VIDEOS[key]) return HERO_VIDEOS[key];
    return null;
  }

  function initHeroVideo() {
    const videoSrc = getHeroVideo();
    const video = document.getElementById('hero-video');
    const vantaBg = document.getElementById('vanta-bg');
    if (!videoSrc || !video) return false;

    video.src = videoSrc;
    video.style.display = 'block';
    if (vantaBg) vantaBg.style.display = 'none';
    return true;
  }

  // ─── Scroll-Fade Parallax ──────────────────────────────────
  // Layer stack (bottom to top):
  //   hero-bg background-image (static hero PNG) — always visible
  //   hero-video (Veo clip) — fades out on scroll, revealing image
  //   hero-bg::after (gradient overlay) — ensures text readability
  //   hero-content (text) — scrolls with page
  //   sections (graduated opacity) — hero image bleeds through
  function initScrollFade() {
    const heroBg = document.querySelector('.hero-bg');
    if (!heroBg) return;

    // Fix hero-bg in place so it persists behind scrolling content
    heroBg.style.position = 'fixed';
    heroBg.style.inset = '0';
    heroBg.style.zIndex = '0';

    // Hero content must float above
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) heroContent.style.zIndex = '3';
    const scrollInd = document.querySelector('.scroll-indicator');
    if (scrollInd) scrollInd.style.zIndex = '3';

    // Fade VIDEO on scroll — reveals static hero image underneath
    const video = document.getElementById('hero-video');
    if (!video) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        // Video fades from 1 → 0 over first 800px of scroll
        const opacity = Math.max(0, 1 - window.scrollY / 800);
        video.style.opacity = opacity;
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ─── Dynamic Section Opacity (hero image bleeds through) ──
  function initScrollOpacity() {
    // Auto-apply scroll-fade to ALL content sections (not just those with the class)
    document.querySelectorAll('.section:not(.section--dark)').forEach(s => {
      s.classList.add('section--scroll-fade');
    });

    const sections = document.querySelectorAll('.section--scroll-fade');
    if (!sections.length) return;

    let ticking = false;
    function update() {
      const vh = window.innerHeight;
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const sectionMid = rect.top + rect.height / 2;

        // How far has this section scrolled into the viewport?
        // 0 = section just entering from bottom, 1 = section at top/past
        const progress = Math.max(0, Math.min(1, 1 - (sectionMid / (vh * 1.2))));

        // Map to opacity: 0.45 (hero very visible) → 0.92 (nearly opaque)
        const opacity = 0.45 + progress * 0.47;
        section.style.setProperty('--section-opacity', opacity.toFixed(3));
      });
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  let vantaEffect = null;

  function initVanta(variant) {
    const el = document.getElementById('vanta-bg');
    if (!el || typeof VANTA === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const effect = getEffect();
    const colors = VANTA_COLORS[variant] || VANTA_COLORS.A;
    const common = { el, mouseControls: true, touchControls: true, gyroControls: false, minHeight: 200, minWidth: 200 };

    // Use transparent background so hero image shows through
    // Blend mode is set via CSS on #vanta-bg
    const transparent = 0x000000;

    try {
      if (effect === 'cells' && VANTA.CELLS) {
        vantaEffect = VANTA.CELLS({
          ...common,
          color1: colors.c1, color2: colors.c2,
          size: 8.0,        // massive, impossible to miss
          speed: 2.0,       // fast, energetic
          scale: 3.0,       // fill the entire hero
          minHeight: 600
        });
      } else if (effect === 'net' && VANTA.NET) {
        vantaEffect = VANTA.NET({
          ...common,
          color: colors.c1,
          backgroundColor: colors.bg,
          points: 20,        // dense network
          maxDistance: 28,    // long connections
          spacing: 12,       // tight grid
          showDots: true
        });
      } else if (effect === 'topology' && VANTA.TOPOLOGY) {
        vantaEffect = VANTA.TOPOLOGY({
          ...common,
          color: colors.c1,
          backgroundColor: colors.bg,
          scale: 2.0
        });
      }
    } catch (err) {
      console.warn('Vanta.js init failed:', err);
    }
  }

  // ─── Human / Machine Mode Toggle ──────────────────────────
  function initModeToggle() {
    const toggle = document.getElementById('mode-toggle');
    if (!toggle) return;
    toggle.querySelectorAll('[data-mode-btn]').forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.modeBtn));
    });
  }

  function setMode(mode) {
    document.body.dataset.mode = mode;
    document.getElementById('mode-toggle')?.querySelectorAll('[data-mode-btn]').forEach(b => {
      const active = b.dataset.modeBtn === mode;
      b.classList.toggle('mode-toggle__btn--active', active);
      b.setAttribute('aria-checked', active);
    });
    if (mode === 'machine') renderMachineContent();
  }

  function renderMachineContent() {
    if (document.body.hasAttribute('data-machine-rendered')) return;
    document.body.setAttribute('data-machine-rendered', '');
    if (typeof LAB_DATA === 'undefined') return;

    // ── Helpers: YAML-safe scalars, block text, DOM text ──
    const q = s => '"' + String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s*\n\s*/g, ' ') + '"';
    const block = (s, indent) => {
      const pad = ' '.repeat(indent);
      const text = String(s == null ? '' : s).replace(/<[^>]+>/g, '').trim();
      if (!text) return '""';
      return '|\n' + text.split(/\n+/).map(line => pad + line.trim()).join('\n');
    };
    const list = (arr, indent) => (arr && arr.length)
      ? '\n' + arr.map(x => ' '.repeat(indent) + '- ' + q(x)).join('\n')
      : ' []';
    const domText = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
    const nameOf = m => m.name.replace(/^Dr\.\s*/, '') + (m.credentials ? ', ' + m.credentials : '');
    const pubMap = {};
    (LAB_DATA.publications || []).forEach(p => { if (p.pmid) pubMap[p.pmid] = p; });
    const grantMap = {};
    (LAB_DATA.grants || []).forEach(g => { grantMap[g.number] = g; });

    // ── Shared builders ──
    const memberYaml = (m, tier) => [
      `  - name: ${q(nameOf(m))}`,
      `    tier: ${q(tier)}`,
      `    role: ${q(m.role || (tier === 'undergraduate' ? 'Undergraduate Researcher' : ''))}`,
      m.roleNow ? `    now: ${q(m.roleNow)}` : '',
      m.program ? `    program: ${q(m.program)}` : '',
      m.funding ? `    funding: ${q(m.funding)}` : '',
      m.focus ? `    focus: ${q(m.focus)}` : '',
      m.project ? `    project: ${q(m.project)}` : '',
      m.awards && m.awards.length ? `    awards:${list(m.awards, 6)}` : '',
      m.award ? `    awards:${list(m.award.split(' · '), 6)}` : '',
      m.skills && m.skills.length ? `    skills:${list(m.skills, 6)}` : '',
      m.bio ? `    bio: ${block(m.bio, 6)}` : ''
    ].filter(Boolean).join('\n');

    const teamYaml = [
      `  - name: ${q(LAB_DATA.pi.shortName + ', ' + LAB_DATA.pi.credentials)}\n    tier: "pi"\n    role: "Principal Investigator"\n    titles: ${q(LAB_DATA.pi.roles.join(' | '))}\n    orcid: ${q(LAB_DATA.pi.links.orcid)}`,
      ...LAB_DATA.team.senior.map(m => memberYaml(m, 'senior')),
      ...LAB_DATA.team.graduate.map(m => memberYaml(m, 'graduate')),
      ...(LAB_DATA.team.specialist || []).map(m => memberYaml(m, 'specialist')),
      ...(LAB_DATA.team.undergraduate || []).map(m => memberYaml(m, 'undergraduate'))
    ].join('\n');

    const alumniYaml = (LAB_DATA.alumni || []).map(a => [
      `  - name: ${q(nameOf(a))}`,
      `    former_role: ${q(a.formerRole)}`,
      `    period: ${q(a.period)}`,
      a.focus ? `    focus: ${q(a.focus)}` : '',
      a.awards && a.awards.length ? `    awards:${list(a.awards, 6)}` : '',
      a.currentPosition ? `    now: ${q(a.currentPosition)}` : '',
      a.bio ? `    bio: ${block(a.bio, 6)}` : ''
    ].filter(Boolean).join('\n')).join('\n');

    const collabYaml = (LAB_DATA.collaborators || []).map(c =>
      `  - name: ${q(c.name)}\n    affiliation: ${q(c.affiliation)}` + (c.area ? `\n    area: ${q(c.area)}` : '')
    ).join('\n');

    const themeYaml = LAB_DATA.themes.map(t =>
      `  - id: ${t.id}\n    title: ${q(t.title)}\n    subtitle: ${q(t.subtitle)}\n    summary: ${q(t.summary)}`
    ).join('\n');
    const connText = (LAB_DATA.themeConnections || []).map(c =>
      `  ${c.from} --${c.strength}--> ${c.to}`
    ).join('\n');
    const newsItem = n => `- [${n.date}] ${n.title}: ${n.description}` +
      (n.tags && n.tags.length ? ` (tags: ${n.tags.join(', ')})` : '') +
      (n.sourceUrl ? `\n  source: ${n.sourceUrl}` : '');

    // ── Hero (all pages) ──
    injectMachine('.hero-content',
`# ${LAB_DATA.lab.fullName}
## ${LAB_DATA.lab.tagline}

> ${LAB_DATA.lab.institution}
> ${LAB_DATA.lab.department}

PI: [${LAB_DATA.pi.name}, ${LAB_DATA.pi.credentials}](${LAB_DATA.pi.links.orcid})
    ${LAB_DATA.pi.roles.join(' | ')}

Pages: [Home](index.html) | [People](people.html) | [Research](research.html) | [News](news.html)
Data:  [llms.txt](llms.txt) | [llms-full.txt](llms-full.txt) | [agents.txt](agents.txt) | [sitemap.xml](sitemap.xml)`);

    // ── HOME PAGE ──
    const mission = document.getElementById('mission');
    if (mission) {
      const pillars = [...mission.querySelectorAll('.card')].map(c =>
        `| ${domText(c.querySelector('h4'))} | ${domText(c.querySelector('p'))} |`
      ).join('\n');
      injectMachine('#mission .container',
`## ${domText(mission.querySelector('.section-header h2'))}

${domText(mission.querySelector('.section-header p'))}

| Pillar | Description |
|--------|-------------|
${pillars}`);
    }

    if (document.getElementById('research-highlights')) {
      injectMachine('#research-highlights .container',
`## Research Theme Ontology

themes:
${themeYaml}

connections:
${connText}`);
    }

    if (document.getElementById('team-preview')) {
      injectMachine('#team-preview .container',
`## Team

members:
${teamYaml}`);
    }

    if (document.getElementById('news-preview')) {
      injectMachine('#news-preview .container',
`## Recent Updates

${LAB_DATA.labNews.slice(0, 3).map(newsItem).join('\n')}

Full list: [news.html](news.html)`);
    }

    if (document.getElementById('for-machines')) {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ResearchOrganization',
        name: LAB_DATA.lab.fullName,
        url: window.location.origin,
        department: LAB_DATA.lab.department,
        parentOrganization: LAB_DATA.lab.institution,
        member: [
          { '@type': 'Person', name: LAB_DATA.pi.shortName + ', ' + LAB_DATA.pi.credentials, jobTitle: 'Principal Investigator', sameAs: LAB_DATA.pi.links.orcid },
          ...['senior', 'graduate', 'specialist', 'undergraduate'].flatMap(tier => (LAB_DATA.team[tier] || []).map(m => {
            const o = { '@type': 'Person', name: nameOf(m), jobTitle: m.roleNow ? m.role + ' (now ' + m.roleNow + ')' : (m.role || 'Undergraduate Researcher') };
            const aw = m.awards || (m.award ? m.award.split(' · ') : null);
            if (aw && aw.length) o.award = aw;
            return o;
          }))
        ],
        alumni: (LAB_DATA.alumni || []).map(a => ({ '@type': 'Person', name: nameOf(a), jobTitle: a.formerRole, award: a.awards || undefined })),
        researchTheme: LAB_DATA.themes.map(t => ({ name: t.title, description: t.summary }))
      };
      injectMachine('#for-machines .for-machines',
`## Structured Data (JSON-LD)

${JSON.stringify(jsonLd, null, 2)}`);
    }

    // ── PEOPLE PAGE ──
    if (document.querySelector('.pi-feature')) {
      const pi = LAB_DATA.pi;
      injectMachine('.pi-feature',
`## Principal Investigator

name: ${q(pi.shortName + ', ' + pi.credentials)}
title: ${q(pi.title)}
roles:${list(pi.roles, 2)}
orcid: ${q(pi.links.orcid)}
pubmed: ${q(pi.links.pubmed)}
scholar: ${q(pi.links.scholar)}

bio: ${block(pi.bio, 2)}`);
    }

    const tierSections = document.querySelectorAll('.tier-section');
    if (tierSections.length > 0 && tierSections[0].parentElement) {
      injectMachine(tierSections[0].parentElement,
`## Full Team Roster

members:
${teamYaml}`);
    }
    if (document.getElementById('collab-grid')) {
      injectMachine('#collaborators .container',
`## Key Collaborators

collaborators:
${collabYaml}`);
    }
    if (document.getElementById('alumni-grid')) {
      injectMachine('#alumni-grid',
`## Alumni

alumni:
${alumniYaml}`);
    }

    // ── RESEARCH PAGE ──
    if (document.getElementById('themes-deep')) {
      const themesDetailed = LAB_DATA.themes.map(t => {
        const papers = (t.keyPapers || []).map(pmid => {
          const p = pubMap[pmid];
          if (!p) return '';
          const note = t.keyPaperNotes && t.keyPaperNotes[pmid] ? `\n        note: ${q(t.keyPaperNotes[pmid])}` : '';
          return `      - pmid: ${pmid}\n        title: ${q(p.title)}\n        journal: ${q(p.journal)}\n        year: ${p.year}${note}\n        url: https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
        }).filter(Boolean).join('\n');
        const funding = (t.grants || []).map(num => {
          const g = grantMap[num];
          return g ? `      - ${q(g.number + ' (' + g.institute + ', ' + g.role + ') — ' + g.period)}` : `      - ${q(num)}`;
        }).join('\n');
        return [
          `  - id: ${t.id}`,
          `    title: ${q(t.title)}`,
          `    subtitle: ${q(t.subtitle)}`,
          `    summary: ${q(t.summary)}`,
          `    detail: ${block(t.detail, 6)}`,
          papers ? `    key_publications:\n${papers}` : '',
          funding ? `    funding:\n${funding}` : ''
        ].filter(Boolean).join('\n');
      }).join('\n');
      injectMachine('#themes .container',
`## Research Themes (Detailed)

themes:
${themesDetailed}

connections:
${connText}`);
    }

    if (document.getElementById('model-grid')) {
      injectMachine('#models .container',
`## Model Systems

models:
${(LAB_DATA.models || []).map(m =>
  `  - name: ${q(m.name)}\n    strength: ${q(m.strength)}\n    use: ${q(m.use)}` + (m.partner ? `\n    partner: ${q(m.partner)}` : '')
).join('\n')}`);
    }

    if (document.getElementById('methods-grid')) {
      injectMachine('#methods .container',
`## Methods

methods:${list(LAB_DATA.methods || [], 2)}`);
    }

    const pubList = document.querySelector('.pub-list');
    if (pubList) {
      const pubs = (LAB_DATA.publications || []).map(p =>
        `@article{${p.pmid || 'unknown'},\n  title = {${p.title}},\n  journal = {${p.journal}},\n  year = {${p.year}},\n  authors = {${p.authors}},\n  pmid = {${p.pmid || ''}},\n  doi = {${p.doi || ''}}\n}`
      ).join('\n\n');
      injectMachine(pubList,
`## Publications (BibTeX)

${pubs}`);
    }

    const grantTable = document.querySelector('.grant-table');
    if (grantTable) {
      injectMachine(grantTable.parentElement || grantTable,
`## Grants

| Grant | Institute | Role | Status | Period |
|-------|-----------|------|--------|--------|
${(LAB_DATA.grants || []).map(g => `| ${g.number} | ${g.institute} | ${g.role} | ${g.status} | ${g.period} |`).join('\n')}`);
    }

    if (document.getElementById('society-list')) {
      injectMachine('#societies .container',
`## ${LAB_DATA.societiesLabel || 'Professional Societies'}

${LAB_DATA.societiesDescription || ''}

societies:
${(LAB_DATA.societies || []).map(s => `  - abbrev: ${q(s.abbrev)}\n    name: ${q(s.name)}`).join('\n')}`);
    }

    // ── NEWS PAGE ──
    const uwNews = document.getElementById('uw-news');
    if (uwNews) {
      const source = 'https://www.obgyn.wisc.edu/categories/stanic-kostic-research-team';
      fetch('data/uw-news-cache.json')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const items = (data && data.articles) ? data.articles.map(a =>
            `- [${a.date || ''}] ${a.title}\n  ${a.summary || ''}\n  link: ${a.link}`
          ).join('\n') : '(no cached items)';
          injectMachine('#uw-news .container',
`## UW OB/GYN Department News (mirror)

source: ${source}
last_updated: ${(data && data.lastUpdated) || ''}

${items}`);
        })
        .catch(() => {});
    }

    const newsSection = document.getElementById('lab-news');
    if (newsSection) {
      injectMachine(newsSection,
`## Lab News (all ${LAB_DATA.labNews.length} items)

${LAB_DATA.labNews.map(newsItem).join('\n')}`);
    }

    if (document.getElementById('gallery-grid')) {
      injectMachine('#gallery .container',
`## Gallery

photos:
${(LAB_DATA.gallery || []).map(g => `  - src: ${q(g.src)}\n    caption: ${q(g.caption)}` + (g.tags && g.tags.length ? `\n    tags:${list(g.tags, 6)}` : '')).join('\n')}`);
    }

    const timeline = document.querySelector('.timeline');
    if (timeline) {
      const milestones = [...timeline.querySelectorAll('.timeline-item')].map(item =>
        `- [${domText(item.querySelector('.timeline-year'))}] ${domText(item.querySelector('h4'))}: ${domText(item.querySelector('.timeline-content p:not(.timeline-year)'))}`
      ).join('\n');
      injectMachine(timeline.parentElement || timeline,
`## Lab Milestones

${milestones}`);
    }
  }

  function injectMachine(selector, mdText) {
    const parent = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!parent) return;
    const div = document.createElement('div');
    div.className = 'machine-content';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'machine-copy';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(mdText).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      });
    });
    const pre = document.createElement('pre');
    pre.className = 'machine-block';
    pre.textContent = mdText;
    div.appendChild(copyBtn);
    div.appendChild(pre);
    parent.appendChild(div);
  }

  // ─── Render Dynamic Content ─────────────────────────────────
  function renderResearchThemes() {
    const container = document.getElementById('themes-grid');
    if (!container || typeof LAB_DATA === 'undefined') return;

    // Pentagon node positions (% of container width/height), clockwise from top:
    // mfi (top-center), pe (upper-right), platforms (lower-right), pcos (lower-left), tissue (upper-left)
    const ORDER = ['mfi', 'pe', 'platforms', 'pcos', 'tissue'];
    const POSITIONS = {
      mfi:       { x: 50,  y: 2  },
      pe:        { x: 90,  y: 30 },
      platforms: { x: 73,  y: 82 },
      pcos:      { x: 27,  y: 82 },
      tissue:    { x: 10,  y: 30 }
    };

    // Build lookup: id → theme object
    const themeMap = {};
    LAB_DATA.themes.forEach(t => { themeMap[t.id] = t; });

    // Build connection lines SVG
    const connections = LAB_DATA.themeConnections || [];
    const svgLines = connections.map(conn => {
      const from = POSITIONS[conn.from];
      const to   = POSITIONS[conn.to];
      if (!from || !to) return '';
      const isStrong = conn.strength === 'strong';
      return `<line
        x1="${from.x}" y1="${from.y}"
        x2="${to.x}"   y2="${to.y}"
        class="theme-conn theme-conn--${conn.strength}"
        vector-effect="non-scaling-stroke"
      />`;
    }).join('\n      ');

    // Build node HTML (positioned absolutely by % coords)
    // Each node: circular image + title link below
    const NODE_R = 68; // px, node circle radius for sizing
    const nodesHtml = ORDER.map(id => {
      const theme = themeMap[id];
      if (!theme) return '';
      const pos = POSITIONS[id];
      return `
        <a href="research.html#${theme.id}"
           class="theme-node"
           data-theme="${theme.id}"
           style="left:${pos.x}%; top:${pos.y}%;"
           aria-label="Explore ${theme.title}">
          <div class="theme-node__img" style="border-color: ${safeColor(theme.color)};">
            <img src="${safeHref(theme.image)}" alt="${theme.title}" loading="lazy">
          </div>
          <span class="theme-node__label">${theme.title}</span>
        </a>`;
    }).join('\n');

    // Render: SVG lines layer + node layer
    container.innerHTML = `
      <svg class="theme-connections-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${svgLines}
      </svg>
      ${nodesHtml}
    `;
  }

  function renderTeamPreview() {
    const container = document.getElementById('team-preview-grid');
    if (!container || typeof LAB_DATA === 'undefined') return;

    // Show PI + senior + grad students + specialists (with credentials)
    function nameWithCreds(m) {
      const base = m.name.replace(/^Dr\.\s*/, '');
      return base + (m.credentials ? ', ' + m.credentials : '');
    }
    const preview = [
      { name: LAB_DATA.pi.shortName + ', ' + LAB_DATA.pi.credentials, role: 'Principal Investigator', focus: 'Vice Chair for Research · Division Director, Reproductive Sciences', initials: 'AS', photo: LAB_DATA.pi.photo },
      ...LAB_DATA.team.senior.map(m => ({ name: nameWithCreds(m), role: m.role, focus: m.focus.split(';')[0], initials: m.initials, photo: m.photo })),
      ...LAB_DATA.team.graduate.map(m => ({ name: nameWithCreds(m), role: m.role, focus: m.focus.split(';')[0], initials: m.initials, photo: m.photo })),
      ...LAB_DATA.team.specialist.map(m => ({ name: nameWithCreds(m), role: m.role, focus: m.focus.split(';')[0], initials: m.initials, photo: m.photo }))
    ];

    container.innerHTML = preview.map(m => `
      <div class="team-member">
        <div class="avatar">${m.photo ? `<img src="${m.photo}" alt="${m.name}">` : m.initials}</div>
        <h4>${m.name}</h4>
        <p class="role">${m.role}</p>
        <p class="focus">${m.focus}</p>
      </div>
    `).join('');
  }

  function renderNewsPreview() {
    const container = document.getElementById('news-preview-list');
    if (!container || typeof LAB_DATA === 'undefined') return;

    const recent = LAB_DATA.labNews.slice(0, 3);

    container.innerHTML = recent.map(item => `
      <div class="news-card">
        <span class="news-date">${item.date}</span>
        <div>
          <h4>${item.title}</h4>
          <p>${item.description}</p>
        </div>
      </div>
    `).join('');
  }

  function renderForMachines() {
    const preview = document.getElementById('json-ld-preview');
    if (!preview || typeof LAB_DATA === 'undefined') return;

    const snippet = {
      '@context': 'https://schema.org',
      '@type': 'ResearchOrganization',
      name: LAB_DATA.lab.fullName,
      url: '...',
      member: `[${LAB_DATA.team.senior.length + LAB_DATA.team.graduate.length + 1} researchers]`,
      researchTheme: LAB_DATA.themes.map(t => t.title)
    };

    preview.textContent = JSON.stringify(snippet, null, 2);
  }

  // ─── Init ───────────────────────────────────────────────────
  function init() {
    const variant = getVariant();
    applyTheme(variant);
    initNav();
    initMobileMenu();
    initSmoothScroll();
    initActiveNav();
    renderResearchThemes();
    renderTeamPreview();
    renderNewsPreview();
    renderForMachines();
    initModeToggle();
    setPageHeroImage();
    // Video takes priority over Vanta; fall back to Vanta if no video
    const hasVideo = initHeroVideo();
    if (!hasVideo) {
      requestAnimationFrame(() => { requestAnimationFrame(() => { initVanta(variant); }); });
    }
    initScrollFade();
    initScrollOpacity();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
