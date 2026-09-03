/**
 * Stanic Lab Website — Scroll Animations
 * GSAP + ScrollTrigger for reveal effects
 * Respects prefers-reduced-motion
 */

(function() {
  'use strict';

  // Skip all animations if reduced motion preferred
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Wait for GSAP to load
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // Track animated elements to prevent double-animation
  const animated = new WeakSet();

  function animateGroup(elements, trigger, opts) {
    if (!elements || elements.length === 0) return;
    // Filter out already-animated elements
    const fresh = Array.from(elements).filter(el => !animated.has(el));
    if (fresh.length === 0) return;
    fresh.forEach(el => animated.add(el));

    gsap.from(fresh, Object.assign({
      y: 24,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: trigger || fresh[0].parentElement,
        start: 'top 85%',
        once: true
      }
    }, opts));
  }

  // ─── Hero entrance ────────────────────────────────────────
  function initHeroAnimation() {
    const heroContent = document.querySelector('.hero-content');
    if (!heroContent) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    const els = [
      { sel: '.hero-label', y: 20, dur: 0.6, t: 0.2 },
      { sel: 'h1', y: 30, dur: 0.8, t: 0.4 },
      { sel: '.hero-tagline', y: 20, dur: 0.6, t: 0.7 },
      { sel: '.hero-pi', y: 15, dur: 0.5, t: 0.9 },
      { sel: '.btn', y: 10, dur: 0.5, t: 1.1 }
    ];

    els.forEach(({ sel, y, dur, t }) => {
      const el = heroContent.querySelector(sel);
      if (el) {
        animated.add(el);
        tl.from(el, { y, opacity: 0, duration: dur }, t);
      }
    });
  }

  // ─── Fade-up reveal for section headers ───────────────────
  function initSectionReveals() {
    document.querySelectorAll('.section .section-header').forEach(header => {
      if (animated.has(header)) return;
      animated.add(header);
      gsap.from(header, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          once: true
        }
      });
    });
  }

  // ─── Staggered grid reveals (cards, member cards, etc.) ───
  function initGridReveals() {
    const grids = document.querySelectorAll('.grid, .team-grid, [class*="-grid"]');
    grids.forEach(grid => {
      animateGroup(grid.children, grid);
    });
  }

  // ─── Timeline items (news page) ──────────────────────────
  function initTimelineReveals() {
    const items = document.querySelectorAll('.timeline-item');
    if (items.length === 0) return;
    animateGroup(items, items[0].parentElement, { x: -20, y: 0, stagger: 0.15 });
  }

  // ─── News items ───────────────────────────────────────────
  function initNewsReveals() {
    const items = document.querySelectorAll('.lab-news-item');
    if (items.length === 0) return;
    animateGroup(items, items[0].parentElement, { y: 16, stagger: 0.08, duration: 0.5 });
  }

  // ─── Publication items (research page) ────────────────────
  function initPubReveals() {
    const items = document.querySelectorAll('.pub-item');
    if (items.length === 0) return;
    animateGroup(items, items[0].parentElement, { y: 12, stagger: 0.04, duration: 0.4 });
  }

  // ─── PI card (people page) ────────────────────────────────
  function initPIReveal() {
    const piCard = document.querySelector('.pi-feature');
    if (!piCard || animated.has(piCard)) return;
    animated.add(piCard);
    gsap.from(piCard, {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: piCard,
        start: 'top 85%',
        once: true
      }
    });
  }

  // ─── Pentagon: SVG line-draw + hover highlight ───────────
  function initPentagonAnimations() {
    const pentagon = document.querySelector('.themes-pentagon');
    if (!pentagon) return;

    // SVG line-draw: animate stroke-dashoffset on scroll
    const lines = pentagon.querySelectorAll('.theme-conn');
    lines.forEach(line => {
      const len = line.getTotalLength ? line.getTotalLength() : 200;
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
    });

    if (lines.length > 0) {
      gsap.to(lines, {
        strokeDashoffset: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: pentagon,
          start: 'top 75%',
          once: true
        }
      });
    }

    // Node stagger reveal — subtle fade-in only (no scale to avoid size issues)
    const nodes = pentagon.querySelectorAll('.theme-node');
    if (nodes.length > 0) {
      gsap.from(nodes, {
        y: 20,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: pentagon,
          start: 'top 80%',
          once: true
        }
      });
    }

    // Hover highlight: dim unrelated nodes and connections
    nodes.forEach(node => {
      const themeId = node.dataset.theme;
      node.addEventListener('mouseenter', () => {
        // Find connected theme IDs
        const conns = typeof LAB_DATA !== 'undefined' ? (LAB_DATA.themeConnections || []) : [];
        const connected = new Set([themeId]);
        conns.forEach(c => {
          if (c.from === themeId) connected.add(c.to);
          if (c.to === themeId) connected.add(c.from);
        });

        // Dim unrelated nodes
        nodes.forEach(n => {
          n.style.opacity = connected.has(n.dataset.theme) ? '1' : '0.25';
          n.style.transition = 'opacity 0.3s ease';
        });

        // Highlight related lines, dim others
        lines.forEach(line => {
          const parent = line.closest('svg');
          if (!parent) return;
          // Check line endpoints against pentagon positions
          const x1 = parseFloat(line.getAttribute('x1'));
          const y1 = parseFloat(line.getAttribute('y1'));
          const x2 = parseFloat(line.getAttribute('x2'));
          const y2 = parseFloat(line.getAttribute('y2'));
          // Match connection by checking if this theme is an endpoint
          const isRelated = conns.some(c =>
            (c.from === themeId || c.to === themeId) &&
            ((connected.has(c.from) && connected.has(c.to)))
          );
          const matchesLine = conns.some(c => {
            if (c.from !== themeId && c.to !== themeId) return false;
            return true;
          });
          line.style.strokeOpacity = matchesLine ? '0.7' : '0.05';
          line.style.transition = 'stroke-opacity 0.3s ease';
        });
      });

      node.addEventListener('mouseleave', () => {
        // Reset all
        nodes.forEach(n => { n.style.opacity = ''; n.style.transition = ''; });
        lines.forEach(l => { l.style.strokeOpacity = ''; l.style.transition = ''; });
      });
    });
  }

  // ─── Init all ─────────────────────────────────────────────
  function init() {
    initHeroAnimation();
    requestAnimationFrame(() => {
      initSectionReveals();
      initPIReveal();
      initGridReveals();
      initTimelineReveals();
      initNewsReveals();
      initPubReveals();
      initPentagonAnimations();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
