// AI-Enhancements (No-AI mode) for portfolio — client-facing polish & features
// Features:
// - Entrance animations (IntersectionObserver) with reduced-motion support
// - Project Snapshot modal + templated milestones + downloadable proposal (HTML)
// - Quick Quote modal (instant estimator + autofill contact)
// - Lightbox with keyboard navigation and lazy-loading improvements
// - Schedule Demo modal (select timeslots, saves lead locally)
// - Sticky CTA with scroll progress and accessible controls
// - Contact autosave, local lead saving & export
// - Local event tracking & small admin export
// Usage: include after your other scripts: <script src="ai-enhancements.js"></script>

(function () {
  const LEADS_KEY = 'devanalytics_leads_v1';
  const EVENT_LOG_KEY = 'devanalytics_events_v1';
  const AUTO_SAVE_KEY = 'devanalytics_contact_draft_v1';

  // --- small helpers ---
  const qs = (s, ctx = document) => ctx.querySelector(s);
  const qsa = (s, ctx = document) => Array.from((ctx || document).querySelectorAll(s));
  const mk = (tag, attrs = {}) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style') el.style.cssText = v;
      else el.setAttribute(k, v);
    });
    return el;
  };

  function saveEvent(evt) {
    try {
      const arr = JSON.parse(localStorage.getItem(EVENT_LOG_KEY) || '[]');
      arr.push(Object.assign({ ts: Date.now() }, evt));
      localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(arr).slice(0, 300000));
    } catch (e) { /* ignore */ }
  }

  // Respect reduced-motion preference
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------ CSS injection ------------------
  function injectStyles() {
    if (qs('#dev_enh_styles')) return;
    const css = `
      /* Micro polish & animations */
      .dev-fade { opacity:0; transform: translateY(10px) scale(.995); transition: opacity .6s cubic-bezier(.2,.9,.3,1), transform .6s cubic-bezier(.2,.9,.3,1); will-change: opacity, transform; }
      .dev-fade.in { opacity:1; transform:none; }
      .dev-pop { transform: scale(.96); transition: transform .36s cubic-bezier(.05,.7,.1,1), opacity .36s; opacity:0; }
      .dev-pop.in { transform: none; opacity:1; }
      .btn { cursor:pointer; }
      .dev-sticky-cta { position:fixed; right:20px; bottom:20px; z-index:9999; display:flex; gap:10px; align-items:center; }
      .dev-cta-btn { background:linear-gradient(135deg,#06b6d4,#2563eb); color:white; border:none; padding:12px 14px; border-radius:999px; box-shadow:0 10px 30px rgba(2,6,23,0.12); font-weight:600; }
      .dev-cta-progress { width:40px; height:40px; border-radius:50%; background:transparent; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:12px; position:relative;}
      .dev-modal { position:fixed; right:20px; bottom:100px; width:420px; max-width:calc(100% - 32px); background:#071026; color:#e6eef8; border-radius:12px; padding:14px; box-shadow:0 12px 40px rgba(2,6,23,0.6); z-index:99998; }
      .dev-modal .close { background:transparent;border:none;color:#9ca3af;cursor:pointer;font-size:16px; }
      .dev-lightbox { display:none; position:fixed; inset:0; background:rgba(2,6,23,0.88); z-index:999999; align-items:center; justify-content:center; padding:20px; }
      .dev-lightbox img { max-width:100%; max-height:90vh; border-radius:8px; box-shadow:0 24px 60px rgba(2,6,23,.8); }
      .dev-filter-bar { display:flex; gap:8px; flex-wrap:wrap; margin:12px 0; align-items:center; }
      .dev-filter-bar button { padding:8px 10px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); background:transparent; color:inherit; cursor:pointer; }
      @media (prefers-reduced-motion: reduce) {
        .dev-fade, .dev-pop { transition:none !important; transform:none !important; opacity:1 !important; }
      }
    `;
    const s = mk('style', { id: 'dev_enh_styles', html: css });
    document.head.appendChild(s);
  }

  // ------------------ Entrance animations ------------------
  function animateOnView() {
    if (REDUCED) return; // skip animations if user prefers reduced motion
    const targets = qsa('header.navbar, .hero, #services, .services-grid, #portfolio, .projects-grid, #skills, #about, #matrix, #testimonials, footer.footer-cta');
    targets.forEach(t => {
      t.classList.add('dev-fade');
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (ent.isIntersecting) {
          ent.target.classList.add('in');
          io.unobserve(ent.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(t => io.observe(t));
  }

  // ------------------ Lightbox ------------------
  function initLightbox() {
    if (qs('#dev_lightbox')) return;
    const overlay = mk('div', { id: 'dev_lightbox', class: 'dev-lightbox', style: 'display:none; flex-direction:column;' });
    overlay.innerHTML = `
      <div style="position:relative; max-width:1200px; width:100%; display:flex; align-items:center; justify-content:center;">
        <button id="dev_lb_close" class="close" aria-label="Close image" style="position:absolute; right:8px; top:8px;">✕</button>
        <button id="dev_lb_prev" aria-label="Previous" style="position:absolute; left:8px; top:50%; transform:translateY(-50%); background:transparent; border:none; color:white; font-size:28px; cursor:pointer;">‹</button>
        <img id="dev_lb_img" src="" alt="" />
        <button id="dev_lb_next" aria-label="Next" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:transparent; border:none; color:white; font-size:28px; cursor:pointer;">›</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const imgs = qsa('.project-image-box img, .projects-grid img, .hero-image');
    const sources = imgs.map(i => ({ src: i.getAttribute('data-src') || i.src, alt: i.alt || '' }));
    imgs.forEach((img, idx) => {
      // ensure lazy-loading attribute
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => open(idx));
    });

    let current = 0;
    const lbImg = qs('#dev_lb_img');
    const open = (i) => {
      current = i;
      lbImg.src = sources[current].src;
      lbImg.alt = sources[current].alt;
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      saveEvent({ action: 'open_lightbox', src: sources[current].src });
    };
    const close = () => {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    };
    const prev = () => {
      current = (current - 1 + sources.length) % sources.length;
      lbImg.src = sources[current].src;
    };
    const next = () => {
      current = (current + 1) % sources.length;
      lbImg.src = sources[current].src;
    };

    qs('#dev_lb_close').addEventListener('click', close);
    qs('#dev_lb_prev').addEventListener('click', prev);
    qs('#dev_lb_next').addEventListener('click', next);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    window.addEventListener('keydown', (e) => {
      if (overlay.style.display !== 'flex') return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });
  }

  // ------------------ Project Snapshot + Downloadable Proposal ------------------
  function inferProjectType(title = '', desc = '') {
    const txt = (title + ' ' + desc).toLowerCase();
    if (/woocommerce|e-?commerce|store/.test(txt)) return 'ecommerce';
    if (/wordpress|plugin/.test(txt)) return 'wordpress';
    if (/dashboard|analytics|tableau|data/.test(txt)) return 'dashboard';
    if (/scrap|scraper|etl|crawl/.test(txt)) return 'scraper';
    if (/php|backend/.test(txt)) return 'backend';
    return 'website';
  }

  function snapshotSummary(title, desc) {
    const type = inferProjectType(title, desc);
    const lead = {
      website: 'Conversion-first responsive website optimized for speed and clarity.',
      ecommerce: 'Revenue-optimized WooCommerce build with secure checkout and catalog performance.',
      wordpress: 'Custom WordPress solution with minimal third-party dependencies and scalable architecture.',
      dashboard: 'Interactive analytics dashboard to consolidate KPIs and operational metrics.',
      scraper: 'Resilient scraper/ETL pipeline to ingest structured data on schedule.',
      backend: 'Reliable backend services and optimized database access for high concurrency.'
    }[type] || 'Technical project focused on measurable business outcomes.';
    const summary = `${title ? title + ' — ' : ''}${lead}${desc ? ' ' + (desc.length > 200 ? desc.slice(0,197) + '...' : desc) : ''}`;
    return { type, summary };
  }

  function milestonesFor(type) {
    switch (type) {
      case 'ecommerce': return ['Discovery & payment flow design', 'Catalog & performance implementation', 'QA, launch, post-launch support'];
      case 'dashboard': return ['Data mapping & ETL design', 'Dashboard build & visual KPIs', 'Automation & handover'];
      case 'scraper': return ['Source specification & rate limiting', 'Scraper build & storage', 'Scheduling & monitoring'];
      case 'wordpress': return ['Theme/plugin scoping', 'Development & performance work', 'Testing & staging release'];
      default: return ['Discovery & scope', 'Core implementation', 'Polish & launch'];
    }
  }

  function attachSnapshotButtons() {
    const cards = qsa('.project-card');
    cards.forEach(card => {
      if (card.querySelector('.dev-snapshot-btn')) return;
      const actions = card.querySelector('.project-actions') || card;
      const btn = mk('button', { class: 'dev-snapshot-btn btn', style: 'margin-left:8px;padding:6px 10px;border-radius:6px;border:none;background:#06b6d4;color:#042f2e;font-weight:600;cursor:pointer;' });
      btn.textContent = 'Snapshot';
      btn.title = 'View project snapshot and download a proposal';
      btn.addEventListener('click', () => {
        const title = (card.querySelector('.project-heading') || {}).innerText || '';
        const desc = (card.querySelector('.project-desc') || {}).innerText || '';
        openSnapshot(title, desc);
      });
      actions.appendChild(btn);
    });
  }

  function openSnapshot(title, desc) {
    let modal = qs('#dev_snapshot_modal');
    if (!modal) {
      modal = mk('div', { id: 'dev_snapshot_modal', class: 'dev-modal', role: 'dialog', 'aria-modal': 'true' });
      modal.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>Project Snapshot</strong>
          <button id="dev_snapshot_close" class="close" aria-label="Close">✕</button>
        </div>
        <div id="dev_snapshot_body" style="margin-top:10px;font-size:13px;line-height:1.4"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
          <button id="dev_download_proposal" class="btn" style="background:#10b981;border:none;color:#023024;padding:8px 10px;border-radius:8px;">Download Proposal</button>
          <button id="dev_autofill_contact" class="btn" style="background:#2563eb;border:none;color:#fff;padding:8px 10px;border-radius:8px;">Autofill Contact</button>
        </div>
      `;
      document.body.appendChild(modal);
      qs('#dev_snapshot_close').addEventListener('click', () => modal.style.display = 'none');
      qs('#dev_autofill_contact').addEventListener('click', () => {
        const body = qs('#dev_snapshot_body');
        const msg = qs('#message');
        if (!msg) { flash('Contact form not found'); return; }
        msg.value = body.innerText + '\n\nPlease contact me to scope and confirm.';
        document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        msg.focus();
        saveEvent({ action: 'autofill_from_snapshot' });
      });
      qs('#dev_download_proposal').addEventListener('click', () => {
        const bodyText = qs('#dev_snapshot_body').innerText || '';
        downloadProposal(title || 'Proposal', bodyText);
      });
    }
    const { type, summary } = snapshotSummary(title, desc);
    const ms = milestonesFor(type);
    const estimate = computeEstimate(type, 'med', 5);
    qs('#dev_snapshot_body').innerHTML = `
      <div style="font-weight:700;margin-bottom:6px">${title || 'Untitled Project'}</div>
      <div style="margin-bottom:8px">${summary}</div>
      <div style="font-weight:700;margin-bottom:6px">Milestones</div>
      <ol style="margin:0 0 8px 18px;padding:0">${ms.map(m => `<li>${m}</li>`).join('')}</ol>
      <div style="font-weight:700">Estimated range</div>
      <div style="color:#bfdbfe;margin-top:6px">${estimate.text}</div>
    `;
    modal.style.display = 'block';
    saveEvent({ action: 'open_snapshot', title });
  }

  // ------------------ Quick Quote (no-AI) ------------------
  function computeEstimate(type, complexity, size) {
    const baseMap = { website: 800, ecommerce: 2200, dashboard: 1800, wordpress: 1400, scraper: 900, backend: 1500 };
    const cm = { low: 1, med: 1.6, high: 2.6 };
    size = Math.max(1, Number(size) || 1);
    const mult = 1 + Math.min(0.02 * (size - 1), 1.0);
    const base = baseMap[type] || 1000;
    const low = Math.round(base * cm[complexity] * mult * 0.85 / 50) * 50;
    const high = Math.round(base * cm[complexity] * mult * 1.25 / 50) * 50;
    const weeks = Math.max(1, Math.round((size * cm[complexity]) / 3));
    const text = `${type} — $${low.toLocaleString()} – $${high.toLocaleString()} · ${weeks}–${weeks + 2} weeks`;
    return { low, high, weeks, text };
  }

  function createQuickQuote() {
    if (qs('#dev_quote_btn')) return;
    const btn = mk('button', { id: 'dev_quote_btn', class: 'dev-cta-btn', style: 'position:fixed; right:20px; bottom:90px; z-index:99997' });
    btn.textContent = 'Quick Quote';
    document.body.appendChild(btn);

    const modal = mk('div', { id: 'dev_quote_modal', class: 'dev-modal', style: 'display:none; right:20px; bottom:160px' });
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center"><strong>Quick Quote</strong><button id="dev_quote_close" class="close">✕</button></div>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
        <select id="dev_q_type" style="padding:8px;border-radius:8px;background:#071026;border:1px solid #1f2a37;color:#e6eef8">
          <option value="website">Responsive Website</option>
          <option value="ecommerce">WooCommerce / E‑commerce</option>
          <option value="dashboard">Analytics Dashboard</option>
          <option value="wordpress">Custom WordPress</option>
          <option value="scraper">Web Scraper / ETL</option>
        </select>
        <select id="dev_q_complexity" style="padding:8px;border-radius:8px;background:#071026;border:1px solid #1f2a37;color:#e6eef8">
          <option value="low">Low</option>
          <option value="med" selected>Medium</option>
          <option value="high">High</option>
        </select>
        <input id="dev_q_size" type="number" min="1" value="5" style="padding:8px;border-radius:8px;background:#071026;border:1px solid #1f2a37;color:#e6eef8"/>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button id="dev_q_est" class="btn" style="background:#10b981;border:none;color:#023024;padding:8px 10px;border-radius:8px;">Estimate</button>
        </div>
        <div id="dev_q_result" style="margin-top:8px;color:#cfe7ff;font-size:13px"></div>
        <div style="display:flex;gap:8px;justify-content:space-between;margin-top:8px">
          <button id="dev_q_fill" class="btn" style="background:#2563eb;color:#fff;padding:8px 10px;border-radius:8px;border:none">Autofill Contact</button>
          <button id="dev_q_save" class="btn" style="background:transparent;border:1px solid #334155;color:#cfe7ff;padding:8px 10px;border-radius:8px">Save Quote</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    btn.addEventListener('click', () => modal.style.display = 'block');
    qs('#dev_quote_close').addEventListener('click', () => modal.style.display = 'none');
    qs('#dev_q_est').addEventListener('click', () => {
      const type = qs('#dev_q_type').value;
      const complexity = qs('#dev_q_complexity').value;
      const size = qs('#dev_q_size').value;
      const r = computeEstimate(type, complexity, size);
      qs('#dev_q_result').innerHTML = `<strong>${r.text}</strong><div style="margin-top:6px;color:#94a3b8;font-size:13px">Includes discovery, milestone-based delivery, one round of revisions.</div>`;
      saveEvent({ action: 'quick_quote_estimate', type, complexity, size, result: r.text });
    });
    qs('#dev_q_fill').addEventListener('click', () => {
      const content = qs('#dev_q_result').innerText || '';
      const msg = qs('#message');
      if (!msg) { flash('Contact form not found'); return; }
      msg.value = `Quick Quote Request\n\n${content}\n\nPlease contact me to scope and confirm milestones.`;
      document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      msg.focus();
      saveEvent({ action: 'autofill_from_quote' });
    });
    qs('#dev_q_save').addEventListener('click', () => {
      const content = qs('#dev_q_result').innerText || '';
      saveLead({ type: 'quick_quote', content });
      flash('Quote saved locally as lead.');
    });
  }

  // ------------------ Schedule Demo widget ------------------
  function createScheduleDemo() {
    if (qs('#dev_schedule_btn')) return;
    const btn = mk('button', { id: 'dev_schedule_btn', class: 'dev-cta-btn', style: 'position:fixed; right:20px; bottom:150px; z-index:99996; background:#0ea5e9' });
    btn.textContent = 'Schedule Demo';
    document.body.appendChild(btn);

    const modal = mk('div', { id: 'dev_schedule_modal', class: 'dev-modal', style: 'display:none; right:20px; bottom:180px' });
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center"><strong>Schedule a 30-min Demo</strong><button id="dev_sched_close" class="close">✕</button></div>
      <div style="margin-top:10px;font-size:13px">
        <label>Select a date<input id="dev_sched_date" type="date" style="width:100%;padding:8px;border-radius:8px;margin-top:6px;background:#071026;border:1px solid #1f2a37;color:#e6eef8"/></label>
        <label style="margin-top:8px">Select a timeslot<div id="dev_timeslots" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px"></div></label>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
          <button id="dev_sched_confirm" class="btn" style="background:#10b981;border:none;color:#023024;padding:8px 10px;border-radius:8px">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    btn.addEventListener('click', () => {
      modal.style.display = 'block';
      // prefill date to tomorrow
      const d = new Date(); d.setDate(d.getDate() + 1);
      qs('#dev_sched_date').value = d.toISOString().slice(0,10);
      populateTimeslots();
    });
    qs('#dev_sched_close').addEventListener('click', () => modal.style.display = 'none');
    qs('#dev_sched_date').addEventListener('change', populateTimeslots);

    function populateTimeslots() {
      const container = qs('#dev_timeslots');
      container.innerHTML = '';
      // create 6 sample slots local time (10:00-16:00) user's timezone
      const base = 10;
      for (let i=0;i<6;i++){
        const h = base + i;
        const btn = mk('button', { class: 'btn', style: 'padding:8px 10px;border-radius:8px;border:1px solid #334155;background:transparent;color:#cfe7ff;cursor:pointer' });
        btn.textContent = `${String(h).padStart(2,'0')}:00`;
        btn.addEventListener('click', () => {
          // mark selected
          qsa('#dev_timeslots button').forEach(b => b.style.outline = 'none');
          btn.style.outline = '2px solid #06b6d4';
          btn.dataset.selected = '1';
        });
        container.appendChild(btn);
      }
    }

    qs('#dev_sched_confirm').addEventListener('click', () => {
      const date = qs('#dev_sched_date').value;
      const slotEl = qsa('#dev_timeslots button').find(b => b.dataset.selected === '1');
      if (!date || !slotEl) { flash('Choose date and timeslot'); return; }
      const slot = slotEl.textContent;
      const name = qs('#name')?.value || 'Prospect';
      const email = qs('#email')?.value || '';
      const content = `Schedule demo request: ${name} (${email}) — ${date} @ ${slot}`;
      saveLead({ type: 'schedule_demo', content });
      flash('Demo scheduled locally. You can export leads from admin.');
      qs('#dev_schedule_modal').style.display = 'none';
      saveEvent({ action: 'schedule_demo', date, slot, email });
    });

  }

  // ------------------ Sticky CTA with scroll progress ------------------
  function createStickyCTA() {
    if (qs('#dev_sticky_cta')) return;
    const wrap = mk('div', { id: 'dev_sticky_cta', class: 'dev-sticky-cta', 'aria-hidden': 'false' });
    const progress = mk('div', { class: 'dev-cta-progress', role: 'img', 'aria-label': 'Scroll progress' });
    progress.innerHTML = '<svg viewBox="0 0 36 36" width="36" height="36" style="transform:rotate(-90deg)"><path id="dev_progress_path" d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32" stroke="#ffffff33" stroke-width="3" fill="none"></path><path id="dev_progress_fill" d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32" stroke="#0ea5e9" stroke-width="3" fill="none" stroke-dasharray="100" stroke-dashoffset="100"></path></svg>';
    const cta = mk('button', { class: 'dev-cta-btn', role: 'button', 'aria-label': 'Book a diagnostic' });
    cta.textContent = 'Book Diagnostic';
    wrap.appendChild(progress);
    wrap.appendChild(cta);
    document.body.appendChild(wrap);

    cta.addEventListener('click', () => {
      // scroll to contact
      document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      qs('#message')?.focus();
      saveEvent({ action: 'cta_book' });
    });

    window.addEventListener('scroll', () => {
      const pct = Math.min(1, document.documentElement.scrollTop / (document.documentElement.scrollHeight - window.innerHeight));
      const fill = qs('#dev_progress_fill');
      const dash = 100 - Math.round(pct * 100);
      if (fill) fill.style.strokeDashoffset = dash;
    });
  }

  // ------------------ Contact autosave + lead saving + export ------------------
  function initContactAutosave() {
    const form = qs('#consultationForm') || qs('form.contact-form') || qs('form');
    if (!form) return;
    const name = qs('#name'); const email = qs('#email'); const message = qs('#message');

    try {
      const draft = JSON.parse(localStorage.getItem(AUTO_SAVE_KEY) || '{}');
      if (draft.name && name) name.value = draft.name;
      if (draft.email && email) email.value = draft.email;
      if (draft.message && message) message.value = draft.message;
    } catch (e) {}

    [name, email, message].forEach(inp => {
      if (!inp) return;
      inp.addEventListener('input', () => {
        const d = { name: name?.value || '', email: email?.value || '', message: message?.value || '' };
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(d));
      });
    });

    form.addEventListener('submit', (e) => {
      // allow page default handlers (EmailJS etc) to run; also store lead locally
      const lead = { type: 'contact', name: name?.value||'', email: email?.value||'', message: message?.value||'', ts: Date.now() };
      saveLead(lead);
      localStorage.removeItem(AUTO_SAVE_KEY);
      flash('Contact saved — thank you. (Saved locally)');
      saveEvent({ action: 'submit_contact', email: lead.email });
    });
  }

  function saveLead(obj) {
    try {
      const arr = JSON.parse(localStorage.getItem(LEADS_KEY) || '[]');
      arr.push(Object.assign({ ts: Date.now() }, obj));
      localStorage.setItem(LEADS_KEY, JSON.stringify(arr).slice(0, 300000));
      saveEvent({ action: 'lead_saved', leadType: obj.type || 'unknown' });
    } catch (e) { console.error(e); }
  }

  function exportLeads() {
    const data = localStorage.getItem(LEADS_KEY) || '[]';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = mk('a', { href: url, download: 'devanalytics_leads.json' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    flash('Leads exported locally.');
  }

  // ------------------ Small admin widget ------------------
  function createAdminWidget() {
    if (qs('#dev_admin')) return;
    const w = mk('div', { id: 'dev_admin', style: 'position:fixed; left:20px; top:20px; z-index:99999; display:flex; flex-direction:column; gap:8px;' });
    w.innerHTML = `
      <button id="dev_export_leads" class="btn" style="background:#111827;color:#cfe7ff;padding:8px;border-radius:8px;border:1px solid #24303f;cursor:pointer">Export Leads</button>
      <button id="dev_view_events" class="btn" style="background:transparent;color:#cfe7ff;padding:8px;border-radius:8px;border:1px solid #334155;cursor:pointer">View Events</button>
    `;
    document.body.appendChild(w);
    qs('#dev_export_leads').addEventListener('click', exportLeads);
    qs('#dev_view_events').addEventListener('click', () => {
      const data = localStorage.getItem(EVENT_LOG_KEY) || '[]';
      const win = window.open('', '_blank');
      win.document.title = 'Dev Analytics — Events Log';
      win.document.body.style.fontFamily = 'Inter, system-ui, Arial, sans-serif';
      win.document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:12px">${escapeHtml(data)}</pre>`;
    });
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  // ------------------ Proposal download (HTML file) ------------------
  function downloadProposal(title, bodyText) {
    const html = `
      <!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
      <style>body{font-family:Inter,system-ui,Arial,sans-serif;padding:28px;color:#0f172a}</style></head><body>
      <h1>${escapeHtml(title)}</h1><pre style="white-space:pre-wrap">${escapeHtml(bodyText)}</pre>
      </body></html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = mk('a', { href: url, download: `${(title||'proposal').replace(/\s+/g,'_')}.html` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    flash('Proposal downloaded (HTML).');
  }

  // ------------------ small UI helpers ------------------
  function flash(msg, ttl = 2600) {
    let f = qs('#dev_flash');
    if (!f) {
      f = mk('div', { id: 'dev_flash', style: 'position:fixed;left:20px;bottom:20px;background:#111827;color:#e6eef8;padding:10px 14px;border-radius:8px;z-index:999999;box-shadow:0 8px 20px rgba(2,6,23,0.5);' });
      document.body.appendChild(f);
    }
    f.textContent = msg;
    f.style.opacity = '1';
    setTimeout(() => { f.style.transition = 'opacity .4s'; f.style.opacity = '0'; setTimeout(() => f.remove(), 500); }, ttl);
  }

  // ------------------ Filter bar ------------------
  function createFilterBar() {
    if (qs('#dev_filter')) return;
    const cards = qsa('.project-card');
    if (!cards.length) return;
    const types = new Set();
    cards.forEach(c => {
      const title = (c.querySelector('.project-heading') || {}).innerText || '';
      const desc = (c.querySelector('.project-desc') || {}).innerText || '';
      const t = inferProjectType(title, desc);
      c.dataset.projType = t;
      types.add(t);
    });
    const bar = mk('div', { id: 'dev_filter', class: 'dev-filter-bar' });
    const allBtn = mk('button', { class: 'filter-btn', 'data-type': 'all' });
    allBtn.textContent = 'All'; bar.appendChild(allBtn);
    Array.from(types).forEach(t => {
      const b = mk('button', { class: 'filter-btn', 'data-type': t });
      b.textContent = t.charAt(0).toUpperCase() + t.slice(1);
      bar.appendChild(b);
    });
    const portfolioSection = qs('#portfolio');
    if (portfolioSection) portfolioSection.insertAdjacentElement('afterend', bar);
    bar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        qsa('.filter-btn').forEach(b => b.style.opacity = '0.6');
        btn.style.opacity = '1';
        qsa('.project-card').forEach(card => {
          card.style.display = (type === 'all' || card.dataset.projType === type) ? '' : 'none';
        });
        saveEvent({ action: 'filter', type });
      });
    });
    allBtn.style.opacity = '1';
  }

  // ------------------ Testimonials rotator ------------------
  function initTestimonials() {
    const cards = qsa('.testimonial-card');
    if (!cards.length) return;
    let i = 0;
    cards.forEach((c, idx) => { c.style.transition = 'opacity .45s, transform .45s'; c.style.opacity = idx === 0 ? '1' : '0'; });
    let int = setInterval(() => {
      cards[i].style.opacity = '0';
      i = (i + 1) % cards.length;
      cards[i].style.opacity = '1';
    }, 4800);
    cards.forEach(c => { c.addEventListener('mouseenter', () => clearInterval(int)); c.addEventListener('mouseleave', () => int = setInterval(() => {
      cards[i].style.opacity = '0'; i = (i + 1) % cards.length; cards[i].style.opacity = '1';
    }, 4800)); });
  }

  // ------------------ Init routine ------------------
  function init() {
    injectStyles();
    animateOnView();
    initLightbox();
    attachSnapshotButtons();
    createQuickQuote();
    createScheduleDemo();
    createStickyCTA();
    initContactAutosave();
    createFilterBar();
    initTestimonials();
    createAdminWidget();
    saveEvent({ action: 'dev_enh_init' });

    // Re-attach on DOM changes (SPA or content changes)
    const mo = new MutationObserver(() => { attachSnapshotButtons(); });
    mo.observe(document.body, { childList: true, subtree: true });

    // keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // '/' toggles quick quote
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        const q = qs('#dev_quote_modal'); if (q) q.style.display = (q.style.display === 'block' ? 'none' : 'block');
        e.preventDefault();
      }
      // 'p' downloads a proposal for first project
      if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
        const first = qs('.project-card'); if (first) {
          const title = (first.querySelector('.project-heading') || {}).innerText || 'Proposal';
          const desc = (first.querySelector('.project-desc') || {}).innerText || '';
          downloadProposal(title, snapshotSummary(title, desc).summary + '\n\nProposed milestones:\n' + milestonesFor(inferProjectType(title,desc)).join('\n'));
        }
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else setTimeout(init, 30);

  // ------------------ Public API for debugging ------------------
  window.DevEnh = {
    exportLeads: () => { exportLeads(); },
    exportEvents: () => {
      const data = localStorage.getItem(EVENT_LOG_KEY) || '[]';
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = mk('a', { href: url, download: 'devanalytics_events.json' }); document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    },
    clearLeads: () => { localStorage.removeItem(LEADS_KEY); flash('Leads cleared'); },
    clearEvents: () => { localStorage.removeItem(EVENT_LOG_KEY); flash('Events*
