// Page Enhancements (accessibility, SEO JSON-LD, form hardening, lazy-load, resume & SW)
// Usage: include <script src="enhancements2.js"></script> before </body>
// NOTE: This file uses only browser APIs (no external services).

(function () {
  'use strict';

  const SITE_AUTHOR_EMAIL = 'message.huzaifa@gmail.com';
  const RESUME_FILENAME = 'MuhammadHuzaifaGohar_Resume.html';
  const SW_PATH = '/sw.js'; // service worker path - place sw.js at repo root

  // ------- Utilities -------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
  const mk = (tag, attrs = {}) => {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'style') e.style.cssText = v;
      else e.setAttribute(k, v);
    });
    return e;
  };
  const log = (...args) => console.info('[enhancements2]', ...args);

  // ------- 1) Inject JSON-LD (Organization / Person) for SEO -------
  function injectJsonLd() {
    try {
      // derive obvious values from page where possible
      const siteName = (document.title && document.title.split('|')[0].trim()) || 'DevAnalytics';
      const url = location.origin + location.pathname;
      const sameAs = Array.from($$('.profile-socials a')).map(a => a.href).filter(Boolean);
      const jsonld = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "ProfessionalService",
            "@id": url + "#organization",
            "name": siteName,
            "url": location.origin,
            "sameAs": sameAs,
            "logo": (document.querySelector('.nav-logo') && document.querySelector('.nav-logo').innerText) || undefined
          },
          {
            "@type": "Person",
            "@id": url + "#person",
            "name": siteName,
            "email": `mailto:${SITE_AUTHOR_EMAIL}`,
            "sameAs": sameAs
          }
        ]
      };
      const script = mk('script', { type: 'application/ld+json' });
      script.textContent = JSON.stringify(jsonld, null, 2);
      document.head.appendChild(script);
      log('JSON-LD injected');
    } catch (e) {
      console.warn('JSON-LD injection failed', e);
    }
  }

  // ------- 2) Skip-to-content link & focus-visible improvements -------
  function addAccessHelpers() {
    // Inject minimal styles for visible focus (keyboard users)
    if (!document.getElementById('enh2_access_styles')) {
      const css = `
        .enh2-skip { position:absolute; left:-999px; top:auto; width:1px; height:1px; overflow:hidden; }
        .enh2-skip:focus { left:20px; top:12px; width:auto; height:auto; padding:8px 12px; background:#fff; color:#0b1220; border-radius:8px; z-index:99999; text-decoration:none; }
        :focus-visible { outline: 3px solid #60a5fa; outline-offset:3px; }
        @media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
      `;
      const s = mk('style', { id: 'enh2_access_styles', html: css });
      document.head.appendChild(s);
    }

    // Skip link
    if (!$('#enh2_skip')) {
      const skip = mk('a', { id: 'enh2_skip', class: 'enh2-skip', href: '#home' });
      skip.textContent = 'Skip to content';
      document.body.insertBefore(skip, document.body.firstChild);
      log('Skip-to-content link added');
    }

    // Keyboard detection: add class on html when using keyboard so we can limit visible focus styles if desired
    (function keyboardDetector() {
      let usingKeyboard = false;
      function handleKey(e) {
        if (!usingKeyboard && (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          usingKeyboard = true;
          document.documentElement.classList.add('enh2-using-keyboard');
        }
      }
      function handleMouse() {
        if (usingKeyboard) {
          usingKeyboard = false;
          document.documentElement.classList.remove('enh2-using-keyboard');
        }
      }
      window.addEventListener('keydown', handleKey, { passive: true });
      window.addEventListener('mousedown', handleMouse, { passive: true });
    })();
  }

  // ------- 3) Lazy-load images & decoding -------
  function ensureLazyImages() {
    const imgs = $$('img');
    imgs.forEach(img => {
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
      // If image lacks width/height and naturalWidth is known, set attributes to reduce CLS.
      // Only set if intrinsic size already available (image already loaded); otherwise skip to avoid layout surprises.
      if (!img.hasAttribute('width') && img.naturalWidth) {
        img.setAttribute('width', img.naturalWidth);
      }
      if (!img.hasAttribute('height') && img.naturalHeight) {
        img.setAttribute('height', img.naturalHeight);
      }
    });
    log('Lazy/async flags applied to images:', imgs.length);
  }

  // ------- 4) Form honeypot & validation for contact form -------
  function hardenContactForm() {
    const form = $('#consultationForm') || $('form.contact-form') || $('form');
    if (!form) {
      log('Contact form not found for hardening');
      return;
    }

    // add honeypot field (visually hidden but accessible to bots)
    if (!form.querySelector('input[name="website"]')) {
      const hp = mk('input', { type: 'text', name: 'website', autocomplete: 'off', value: '' });
      hp.style.cssText = 'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;';
      form.appendChild(hp);
    }

    // add small inline error container
    function ensureErrorArea() {
      let err = form.querySelector('.enh2_errors');
      if (!err) {
        err = mk('div', { class: 'enh2_errors', style: 'color:#fca5a5;margin-bottom:8px;font-size:13px;' });
        form.insertBefore(err, form.firstChild);
      }
      return err;
    }

    // prevent double submit
    form.addEventListener('submit', function (e) {
      const hp = form.querySelector('input[name="website"]');
      if (hp && hp.value.trim() !== '') {
        e.preventDefault();
        const err = ensureErrorArea();
        err.innerText = 'Spam detection blocked this submission.';
        log('Honeypot triggered; submission blocked');
        return false;
      }

      // basic validation for name, email, message
      const name = form.querySelector('input[name="from_name"], #name') || form.querySelector('input[name="name"]');
      const email = form.querySelector('input[name="reply_to"], #email') || form.querySelector('input[type="email"]');
      const message = form.querySelector('textarea[name="message"], #message');

      const errors = [];
      if (name && name.value.trim().length < 2) errors.push('Please enter your name.');
      if (email) {
        const v = email.value.trim();
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(v)) errors.push('Please enter a valid business email.');
      } else {
        errors.push('Email field not found on form.');
      }
      if (message && message.value.trim().length < 5) errors.push('Please describe the project or bottleneck briefly.');

      if (errors.length) {
        e.preventDefault();
        const err = ensureErrorArea();
        err.innerHTML = errors.map(x => `<div>${x}</div>`).join('');
        const firstInvalid = form.querySelector('input:invalid, textarea:invalid') || form.querySelector('input[name="from_name"], input[name="reply_to"], textarea[name="message"]');
        if (firstInvalid) firstInvalid.focus();
        return false;
      }

      // disable submit button to avoid double-submits
      const btn = form.querySelector('button[type="submit"], .form-submit-btn');
      if (btn) {
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
        setTimeout(() => { btn.disabled = false; btn.removeAttribute('aria-disabled'); }, 60000); // re-enable after 60s if something goes wrong
      }

      // allow default action to proceed (EmailJS etc) and capture local lead copy
      try {
        const lead = {
          name: name?.value || '',
          email: email?.value || '',
          message: message?.value || '',
          ts: Date.now()
        };
        const existing = JSON.parse(localStorage.getItem('devanalytics_leads_v1') || '[]');
        existing.push(lead);
        localStorage.setItem('devanalytics_leads_v1', JSON.stringify(existing).slice(0, 300000));
        log('Saved lead locally');
      } catch (err) {
        console.warn('Could not save lead locally', err);
      }
      return true;
    }, { capture: true });
    log('Contact form hardened (honeypot + validation)');
  }

  // ------- 5) Resume download button (extract from About) -------
  function addResumeDownload() {
    // add button near About section or footer
    if ($('#enh2_resume_btn')) return;
    const about = $('#about') || $('.about-bio') || $('#home') || document.body;
    const btn = mk('button', { id: 'enh2_resume_btn', class: 'btn', style: 'margin-left:8px;padding:8px 10px;border-radius:8px;background:#2563eb;color:#fff;border:none;cursor:pointer;' });
    btn.textContent = 'Download Resume';
    btn.title = 'Download a quick HTML resume created from this page';
    btn.addEventListener('click', () => {
      // build minimal resume using About section
      const name = document.querySelector('.nav-logo')?.innerText?.trim() || document.title || 'Muhammad Huzaifa Gohar';
      const bio = $('#about .bio-lead')?.innerText?.trim() || $('#about .about-bio')?.innerText?.trim() || '';
      const skills = $$('.skill-pill').map(s => s.innerText.trim()).join(', ');
      const socials = $$('.profile-socials a').map(a => `${a.title || a.href}: ${a.href}`).join('\n');
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(name)} - Resume</title><style>body{font-family:Inter,system-ui,Arial,sans-serif;padding:28px;color:#0b1220}h1{margin-bottom:8px}</style></head><body><h1>${escapeHtml(name)}</h1><div>${escapeHtml(bio)}</div><h2>Skills</h2><div>${escapeHtml(skills)}</div><h2>Social</h2><pre>${escapeHtml(socials)}</pre></body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = mk('a', { href: url, download: RESUME_FILENAME });
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      log('Resume downloaded');
    });

    // try to append into about-profile-column social area if found
    const target = $('#about .profile-socials') || $('#about .about-bio') || document.querySelector('.navbar-container');
    if (target) target.appendChild(btn);
    else document.body.appendChild(btn);
    log('Resume download button added');
  }

  // ------- 6) Copy-email quick buttons -------
  function addCopyEmailButtons() {
    const email = SITE_AUTHOR_EMAIL;
    const addBtnTo = (container) => {
      if (!container || container.querySelector('.enh2_copy_email')) return;
      const btn = mk('button', { class: 'enh2_copy_email', style: 'margin-left:8px;padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:inherit;cursor:pointer;' });
      btn.textContent = 'Copy Email';
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(email);
          alert('Email copied to clipboard');
        } catch (e) {
          prompt('Copy email', email);
        }
      });
      container.appendChild(btn);
    };

    addBtnTo($('#about .profile-socials'));
    addBtnTo($('footer.footer-cta'));
    log('Copy-email buttons added where possible');
  }

  // ------- 7) Service Worker registration -------
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      log('Service Worker not supported in this browser');
      return;
    }
    // attempt registration if sw.js exists (HTTP 200). Register quietly.
    navigator.serviceWorker.register(SW_PATH).then(reg => {
      log('Service Worker registered:', reg.scope);
    }).catch(err => {
      console.warn('Service Worker registration failed:', err);
    });
  }

  // ------- helpers -------
  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  // ------- Boot (run on DOMContentLoaded) -------
  function init() {
    injectJsonLd();
    addAccessHelpers();
    ensureLazyImages();
    hardenContactForm();
    addResumeDownload();
    addCopyEmailButtons();
    registerServiceWorker();

    // monitor for dynamically added images and apply lazy flags
    const mo = new MutationObserver((mutations) => {
      let added = false;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length) {
          added = true; break;
        }
      }
      if (added) ensureLazyImages();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    log('Enhancements2 initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 20);
  }

})();