/* ===== index.js =====
   Behavior:
   - hero phrase rotation (fade)
   - reveal-on-scroll (.fade-reveal)
   - mobile nav toggle (hamburger)
   - modal open/close with animated gradient backdrop
   - Enter-key opens modal (unless typing)
   - focus trap + accessibility basics
   - small non-blocking toast after demo submit
   ================================================== */

/* set dynamic year */
(function setYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  })();
  
  /* ===== Hero phrase rotation (fade) ===== */
  (function heroPhrases() {
    const ids = ['phrase0', 'phrase1', 'phrase2'];
    let cur = 0;
    const intervalMs = 3000;
  
    function show(index) {
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (i === index) el.classList.add('show');
        else el.classList.remove('show');
      });
    }
  
    // initial
    show(0);
    const timer = setInterval(() => {
      cur = (cur + 1) % ids.length;
      show(cur);
    }, intervalMs);
  
    // respect reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq && mq.matches) {
      clearInterval(timer);
      show(0);
    }
  })();
  
  /* ===== Reveal on scroll for .fade-reveal ===== */
  (function revealOnScroll() {
    const els = document.querySelectorAll('.fade-reveal');
    if (!els.length) return;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  })();
  
  /* ===== Mobile nav toggle (hamburger left) ===== */
  (function mobileNavToggle() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    if (!mobileBtn || !mobileNav) return;
  
    mobileNav.classList.add('hidden');
  
    mobileBtn.addEventListener('click', () => {
      const isHidden = mobileNav.classList.contains('hidden');
      if (isHidden) {
        mobileNav.classList.remove('hidden');
        mobileNav.classList.add('show');
      } else {
        mobileNav.classList.remove('show');
        mobileNav.classList.add('hidden');
      }
    });
  
    // hide mobile nav on desktop resize
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        mobileNav.classList.remove('show');
        mobileNav.classList.add('hidden');
      }
    }, { passive: true });
  })();
  
  /* ===== Modal logic: open/close, animated gradient, Enter behavior, focus trap ===== */
  (function modalLogic() {
    const openButtons = [
      document.getElementById('joinNowBtn'),
      document.getElementById('joinNowBtnDuplicate')
    ].filter(Boolean);
  
    const modal = document.getElementById('joinModal');
    const backdrop = document.getElementById('joinModalBackdrop');
    const btnClose = document.getElementById('joinModalClose');
    const btnCancel = document.getElementById('joinModalCancel');
    const form = document.getElementById('joinModalForm');
  
    if (!modal || !backdrop) {
      // If markup missing, bail gracefully.
      return;
    }
  
    // create the animated-gradient element inside backdrop if not present
    function ensureAnimatedGradient() {
      let ag = backdrop.querySelector('.animated-gradient');
      if (!ag) {
        ag = document.createElement('div');
        ag.className = 'animated-gradient hidden';
        ag.setAttribute('aria-hidden', 'true');
        backdrop.insertBefore(ag, backdrop.firstChild);
      }
      return ag;
    }
  
    let animatedGradient = ensureAnimatedGradient();
    let lastFocused = null;
  
    function openModal() {
      lastFocused = document.activeElement;
      modal.classList.remove('hidden');
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
  
      // show gradient and animate if user allows motion
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (!mq.matches && animatedGradient) {
        animatedGradient.classList.remove('hidden');
        // ensure CSS paints before activating animation
        requestAnimationFrame(() => {
          backdrop.classList.add('animate-gradient');
        });
      } else if (animatedGradient) {
        // no animation fallback: keep gradient visible but don't animate
        animatedGradient.classList.remove('hidden');
        backdrop.classList.remove('animate-gradient');
      }
  
      // focus first focusable element inside modal
      const first = modal.querySelector('input, select, textarea, button');
      if (first) first.focus();
  
      document.addEventListener('keydown', onKeyDown);
    }
  
    function closeModal() {
      // stop gradient animation gracefully
      if (animatedGradient) {
        backdrop.classList.remove('animate-gradient');
        // hide the gradient after a short delay to allow fade
        setTimeout(() => animatedGradient && animatedGradient.classList.add('hidden'), 320);
      }
  
      modal.classList.remove('show');
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
  
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
      document.removeEventListener('keydown', onKeyDown);
    }
  
    function onKeyDown(e) {
      if (e.key === 'Escape') { closeModal(); return; }
  
      if (e.key === 'Tab') {
        const focusable = modal.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  
    // attach event handlers
    openButtons.forEach(btn => btn.addEventListener('click', openModal));
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
  
    // click outside to close
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal || ev.target === backdrop) closeModal();
    });
  
    // demo form submit: replace with real API
    if (form) {
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Joining...';
        }
        setTimeout(() => {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Join Now'; }
          closeModal();
          showToast('Thanks! Check your email to confirm.');
        }, 900);
      });
    }
  
    // Open modal on Enter key when user is not typing in an input/select/textarea
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const active = document.activeElement;
      const tag = active && active.tagName ? active.tagName.toLowerCase() : null;
      const typingTags = ['input','textarea','select'];
      if (typingTags.includes(tag)) return; // user typing -> ignore
      openModal();
    });
  
    /* small toast helper (non-blocking) */
    function showToast(msg, timeout=3200) {
      const t = document.createElement('div');
      t.textContent = msg;
      t.className = 'fixed left-1/2 -translate-x-1/2 bottom-8 bg-indigo-600 text-white px-4 py-2 rounded-md shadow-lg z-60';
      document.body.appendChild(t);
      setTimeout(()=> t.remove(), timeout);
    }
  
    // Ensure animatedGradient exists on load
    animatedGradient = ensureAnimatedGradient();
  })();
  
