// Formal entrance animations for MuhammadHuzaifaGohar/Portfolio
// Usage: include <script src="animations.js"></script> before </body>
// - Injects CSS for animation styles
// - Adds data-animate/data-variant attributes to DOM targets
// - Observes with IntersectionObserver and applies .in-view with optional stagger

(function () {
  // --- Inject animation CSS ---
  const css = `
  /* Core states */
  [data-animate] {
    opacity: 0;
    transform-origin: center;
    will-change: opacity, transform;
    transition-property: opacity, transform;
    transition-timing-function: cubic-bezier(.2,.9,.3,1);
    transition-duration: 640ms;
  }

  /* Visible state */
  [data-animate].in-view {
    opacity: 1;
    transform: none;
  }

  /* Variants */
  [data-variant="fade-up"] { transform: translateY(18px) scale(.995); }
  [data-variant="fade-left"] { transform: translateX(-18px) scale(.995); }
  [data-variant="fade-right"] { transform: translateX(18px) scale(.995); }
  [data-variant="scale-up"] { transform: scale(.96) translateY(6px); transition-timing-function: cubic-bezier(.05,.7,.1,1); }
  [data-variant="pop"] { transform: scale(.92); transition-duration: 420ms; }
  [data-variant="fade"] { transform: translateY(6px) scale(1); transition-duration: 540ms; }

  /* Stagger helper (children must get inline --stagger-index) */
  [data-stagger] > * {
    transition-delay: calc(var(--stagger-index, 0) * 80ms);
  }

  /* Slightly different nav transition */
  header.navbar[data-animate] { transition-duration: 520ms; transition-timing-function: cubic-bezier(.2,.85,.25,1); }

  /* Respect user pref for reduced motion */
  @media (prefers-reduced-motion: reduce) {
    [data-animate] { transition: none !important; transform: none !important; opacity: 1 !important; }
    [data-stagger] > * { transition-delay: 0ms !important; }
  }
  `;

  const style = document.createElement('style');
  style.setAttribute('data-generated-by', 'animations.js');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  // --- Helper: set dataset and stagger indices ---
  function setAnimateAttr(el, variant = 'fade-up', stagger = false) {
    if (!el) return;
    el.setAttribute('data-animate', 'true');
    el.setAttribute('data-variant', variant);
    if (stagger) el.setAttribute('data-stagger', 'true');
  }

  function applyStaggerIndices(container) {
    if (!container) return;
    const children = Array.from(container.children);
    children.forEach((c, i) => {
      c.style.setProperty('--stagger-index', i);
      // For children that should themselves be observed, mark them too
      if (!c.hasAttribute('data-animate')) {
        // choose a subtle default if not already set
        c.setAttribute('data-variant', 'fade-up');
        c.setAttribute('data-animate', 'true');
      }
    });
  }

  // --- Map selectors to animation variants and optional staggering ---
  const mapping = [
    { sel: '.top-banner', variant: 'fade-left' },
    { sel: 'header.navbar', variant: 'fade-up' },
    { sel: '.hero', variant: 'fade-up' },
    { sel: '.hero .hero-image-container', variant: 'fade-right' },
    { sel: '.hero .hero-content .hero-actions', variant: 'pop' },

    { sel: '#services', variant: 'fade-up' },
    { sel: '.services-grid', variant: 'fade-up', staggerChildren: '.service-card' },
    { sel: '.services-grid .service-card', variant: 'fade-up' },

    { sel: '#portfolio', variant: 'fade-up' },
    { sel: '.projects-grid', variant: 'fade-up', staggerChildren: '.project-card' },
    { sel: '.projects-grid .project-card', variant: 'fade-up' },

    { sel: '.skills-grid', variant: 'fade-up', staggerChildren: '.skill-pill' },
    { sel: '.skill-pill', variant: 'scale-up' },

    { sel: '#about', variant: 'fade-up' },
    { sel: '#about .about-profile-column', variant: 'fade-right' },
    { sel: '#about .about-bio', variant: 'fade-left' },

    { sel: '#matrix', variant: 'fade-up', staggerChildren: '.matrix-grid-row' },
    { sel: '.matrix-grid-row', variant: 'fade-up' },

    { sel: '#testimonials', variant: 'fade-up', staggerChildren: '.testimonial-card' },
    { sel: '.testimonial-card', variant: 'fade-up' },

    { sel: 'footer.footer-cta', variant: 'fade-up' },

    // small UI bits
    { sel: '#gemini-chat-btn', variant: 'pop' },
    { sel: '#gemini-chat-popup', variant: 'fade-up' },
  ];

  // --- Apply attributes to DOM according to mapping ---
  mapping.forEach(item => {
    try {
      const nodes = document.querySelectorAll(item.sel);
      if (!nodes || nodes.length === 0) return;
      nodes.forEach(node => {
        setAnimateAttr(node, item.variant || 'fade-up', !!item.staggerChildren);
        // if container should stagger children, mark container and its children
        if (item.staggerChildren) {
          const childSelector = item.staggerChildren;
          const container = node;
          const children = container.querySelectorAll(childSelector);
          // mark container as staggered and set indices on children
          container.setAttribute('data-stagger', 'true');
          Array.from(children).forEach((c, i) => {
            c.style.setProperty('--stagger-index', i);
            // mark child if not already marked
            if (!c.hasAttribute('data-animate')) {
              c.setAttribute('data-animate', 'true');
              c.setAttribute('data-variant', 'fade-up');
            }
          });
        }
      });
    } catch (e) {
      // ignore selector errors
      // console.warn('animation mapping error for', item.sel, e);
    }
  });

  // Also mark any .project-actions buttons for a tiny fade
  document.querySelectorAll('.project-actions .btn').forEach((b, i) => {
    b.setAttribute('data-animate', 'true');
    b.setAttribute('data-variant', 'pop');
    b.style.setProperty('--stagger-index', i);
  });

  // Ensure nav links animate with small stagger on page load
  const navLinks = Array.from(document.querySelectorAll('.nav-links .nav-link'));
  navLinks.forEach((a, i) => {
    a.setAttribute('data-animate', 'true');
    a.setAttribute('data-variant', 'fade-up');
    a.style.setProperty('--stagger-index', i);
  });

  // --- IntersectionObserver to toggle .in-view ---
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.12
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        // small per-element delay boost for nicer sequencing
        const baseDelay = parseFloat(getComputedStyle(el).transitionDelay) || 0;
        // add class immediately — stagger handled by child transition-delay custom property
        el.classList.add('in-view');

        // If element has data-stagger, ensure children animate slightly after container
        if (el.hasAttribute('data-stagger')) {
          // reveal children with small additional delay
          const children = Array.from(el.children);
          children.forEach((c, idx) => {
            // we ensure each child will transition with its --stagger-index
            c.classList.add('in-view');
          });
        }
        // If we want to reveal only once, unobserve after first intersection
        observer.unobserve(el);
      }
    });
  }, observerOptions);

  // Observe all elements that have data-animate
  const observeAll = () => {
    document.querySelectorAll('[data-animate]').forEach(el => {
      // If already visible on load, add in-view quickly
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < viewportHeight * 0.85 && rect.bottom > 0) {
        // visible enough - apply with tiny delay to allow CSS injection to settle
        setTimeout(() => el.classList.add('in-view'), 30);
      } else {
        observer.observe(el);
      }
    });
  };

  // Small entrance for nav on DOMContentLoaded
  const navInit = () => {
    const nav = document.querySelector('header.navbar');
    if (!nav) return;
    setTimeout(() => {
      nav.classList.add('in-view');
      // reveal links with a cascading effect
      navLinks.forEach((a, i) => {
        setTimeout(() => a.classList.add('in-view'), 70 + i * 60);
      });
    }, 80);
  };

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // small timeout so CSS has been appended
      setTimeout(() => {
        observeAll();
        navInit();
      }, 20);
    });
  } else {
    setTimeout(() => {
      observeAll();
      navInit();
    }, 20);
  }

  // Expose a small API in case you want to trigger reveals manually
  window.__DEVANIM = {
    reveal(selector) {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('in-view');
        try { observer.unobserve(el); } catch {}
      });
    },
    reset(selector) {
      document.querySelectorAll(selector || '[data-animate]').forEach(el => {
        el.classList.remove('in-view');
        try { observer.observe(el); } catch {}
      });
    }
  };
})();