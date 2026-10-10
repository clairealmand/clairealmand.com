// Scroll-driven day: crossfades Claire's photos and updates the corner clock as each chapter reaches mid-screen.
(function () {
  var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-key][data-clock]'));
  var photos = document.querySelectorAll('.photos .ph');
  var clock = document.querySelector('.clock');
  var clockText = document.getElementById('clock-text');
  var orbs = { dawn: '#F4A07F', early: '#F7B98A', morning: '#FFE29A', midday: '#FFF2B8', golden: '#F2C46B', sunset: '#F2836B', autumn: '#F2C46B', winter: '#DCEBFA', spring: '#F7C6D9', summer: '#B8E6A0' };
  var current = '';
  var byKey = {}, order = [];
  photos.forEach(function (ph) { var k = ph.getAttribute('data-key'); byKey[k] = ph; order.push(k); });
  if (order.length) byKey[order[0]]._ready = true;
  var webp = (function () { try { return document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0; } catch (e) { return false; } })();

  var ticking = false;

  function update() {
    ticking = false;
    var mid = window.innerHeight * 0.5;
    var active = chapters[0];
    for (var i = 0; i < chapters.length; i++) {
      if (chapters[i].getBoundingClientRect().top < mid) active = chapters[i];
    }
    var key = active.getAttribute('data-key');
    if (key === current) return;
    // Hold the current photo until the next one has arrived, so the sky never flashes blank.
    var target = byKey[key], idx = order.indexOf(key);
    loadPh(target); loadPh(byKey[order[idx + 1]]);
    if (target && !target._ready && !target._failed) return;
    current = key;
    // A photo that failed to load keeps the previous sky up rather than showing a blank.
    if (!target || !target._failed) photos.forEach(function (ph) { ph.classList.toggle('on', ph.getAttribute('data-key') === key); });
    clockText.textContent = active.getAttribute('data-clock') + ' · ' + active.getAttribute('data-name');
    clock.classList.toggle('moon', key === 'dusk' || key === 'night');
    clock.style.setProperty('--orb', orbs[key] || '#EDE7D6');
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();

  // Only the dawn photo loads up front. After that the sky loads one chapter ahead of the reader,
  // then fills in the rest while the page is idle. WebP where the browser takes it, JPEG otherwise.
  function loadPh(ph) {
    if (!ph || ph._ready || ph._loading) return;
    var src = ph.getAttribute('data-bg');
    if (!src) { ph._ready = true; return; }
    ph._loading = true;
    var tries = webp ? [src.replace(/\.jpg$/, '.webp'), src] : [src];
    (function attempt() {
      var url = tries.shift(), img = new Image();
      img.onload = function () {
        ph.style.backgroundImage = "url('" + url + "')"; ph.removeAttribute('data-bg');
        ph._ready = true; ph._loading = false; update();
      };
      // WebP failed: try the JPEG. Both failed: give up and let the clock move on without this photo.
      img.onerror = function () { if (tries.length) attempt(); else { ph._failed = true; ph._loading = false; update(); } };
      img.src = url;
    })();
  }
  var started = false;
  function warmSky() {
    if (started) return;
    started = true;
    loadPh(photos[1]);
    var rest = Array.prototype.slice.call(photos, 2), idle = window.requestIdleCallback || function (fn) { setTimeout(fn, 400); };
    (function next() { var ph = rest.shift(); if (!ph) return; idle(function () { loadPh(ph); next(); }); })();
  }
  window.addEventListener('scroll', warmSky, { passive: true, once: true });
  setTimeout(warmSky, 2500);
  // Homepage nav: past the hero it tucks away, and slides back in as soon as the reader scrolls up
  // (or tabs into it), so Work, Story, Writing, and Contact stay one move away.
  var nav = document.querySelector('.home-nav'), hero = document.querySelector('.hero');
  if (nav && hero) {
    var lastY = window.scrollY, navTick = false;
    var navUpdate = function () {
      navTick = false;
      var y = window.scrollY, past = y > hero.offsetHeight * 0.6;
      nav.classList.toggle('stuck', past);
      if (!past) nav.classList.remove('show');
      else if (y < lastY - 4) nav.classList.add('show');
      else if (y > lastY + 4 && !nav.contains(document.activeElement)) nav.classList.remove('show');
      lastY = y;
    };
    window.addEventListener('scroll', function () { if (!navTick) { navTick = true; requestAnimationFrame(navUpdate); } }, { passive: true });
    nav.addEventListener('focusin', function () { nav.classList.add('show'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setTimeout(function () { nav.classList.remove('show'); }, 50); });
  }
  // "Send an owl" form: posts to /api/owl and reports back without leaving the page.
  // Text stays in the form until the owl is confirmed sent. Each message carries an id, so a retry after
  // a timeout can't deliver the same owl twice; editing the message starts a new id.
  var owl = document.querySelector('.owl-form');
  if (owl) {
    var stamp = owl.querySelector('input[name="t"]');
    if (stamp) stamp.value = String(Date.now());
    var btn = owl.querySelector('button'), status = owl.querySelector('.owl-status'), sending = false, owlId = '';
    var newId = function () { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(36).slice(2, 10); };
    var say = function (msg, kind) { status.textContent = msg; status.setAttribute('data-kind', kind || ''); };
    owl.addEventListener('input', function () { owlId = ''; });
    // Links like /?topic=speaking#owl preselect the reason for writing.
    var topicParam = (location.search.match(/[?&]topic=(\w+)/) || [])[1];
    if (topicParam && owl.elements.topic && owl.elements.topic.querySelector('option[value="' + topicParam + '"]')) owl.elements.topic.value = topicParam;
    // Diagnostics only: the failure type and topic, never the name, email, or message.
    var fail = function (type) { if (window.gtag) gtag('event', 'contact_error', { failure_type: type, inquiry_type: (owl.elements.topic && owl.elements.topic.value) || 'general' }); };
    var unsure = function () {
      btn.textContent = 'Try again';
      say('No word back from the owl, so it may or may not have arrived. Your message is still here if you want to try again or book a call above.', 'unsure');
    };
    owl.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      if (!owlId) owlId = newId();
      var data = new FormData(owl); data.append('id', owlId);
      sending = true; btn.disabled = true; say('Sending…');
      var ctrl = window.AbortController ? new AbortController() : null;
      var timedOut = false;
      var timer = setTimeout(function () { timedOut = true; if (ctrl) ctrl.abort(); }, 15000);
      var done = function () { clearTimeout(timer); sending = false; btn.disabled = false; };
      fetch(owl.action, { method: 'POST', body: data, signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { return r.json().catch(function () { return { unclear: true }; }); })
        .then(function (res) {
          done();
          if (res.ok) {
            // Count a lead only once the server confirms delivery. No name, email, or message goes to analytics.
            if (window.gtag) gtag('event', 'generate_lead', { lead_method: 'contact_form', inquiry_type: (owl.elements.topic && owl.elements.topic.value) || 'general' });
            owl.reset(); owlId = ''; btn.textContent = 'Send another owl'; say('Owl sent. I’ll write back soon.', 'ok');
          }
          else if (res.error === 'missing') say('Please add your name, a valid email, and a message.', 'error');
          else if (res.unclear) { fail('server'); unsure(); }
          else { fail('server'); btn.textContent = 'Try again'; say('The owl didn’t make it. Your message is still here, so you can try again, or book a call above.', 'error'); }
        })
        .catch(function () { done(); fail(timedOut ? 'timeout' : 'network'); unsure(); });
    });
  }
  // Guild crests: phones have no hover, so wake each animal briefly as its card scrolls into view, and on tap.
  var members = document.querySelectorAll('.member');
  function wake(m, ms) { m.classList.add('awake'); clearTimeout(m._t); m._t = setTimeout(function () { m.classList.remove('awake'); }, ms); }
  members.forEach(function (m) { m.addEventListener('click', function (e) { if (!e.target.closest('a')) wake(m, 2400); }); });
  if (window.matchMedia && matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (en.isIntersecting) { io.unobserve(en.target); setTimeout(function () { wake(en.target, 2400); }, i * 500); }
      });
    }, { threshold: 0.8 });
    members.forEach(function (m) { io.observe(m); });
  }
  // Spellbook shelf: newest posts first in a sideways slider, with chips to show one series at a time.
  var shelf = document.querySelector('[data-shelf]');
  if (shelf) {
    var track = shelf.querySelector('.issues'), posts = track.querySelectorAll('.issue');
    var shelfNav = shelf.querySelector('.slide-nav'), prev = shelf.querySelector('.slide-btn.prev'), next = shelf.querySelector('.slide-btn.next');
    var shelfChips = shelf.querySelectorAll('.chip');
    var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    shelf.querySelector('.shelf-bar').hidden = false;
    // Arrows only when there's somewhere to go; each end greys out its arrow.
    var ends = function () {
      var max = track.scrollWidth - track.clientWidth;
      shelfNav.hidden = max <= 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
    };
    var slide = function (dir) {
      var card = track.querySelector('.issue:not([hidden])');
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: dir * (card ? card.offsetWidth + gap : track.clientWidth), behavior: calm ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', function () { slide(-1); });
    next.addEventListener('click', function () { slide(1); });
    var shelfTick = false;
    track.addEventListener('scroll', function () { if (!shelfTick) { shelfTick = true; requestAnimationFrame(function () { shelfTick = false; ends(); }); } }, { passive: true });
    window.addEventListener('resize', ends);
    shelfChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-f');
        shelfChips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        posts.forEach(function (p) { p.hidden = f !== 'all' && p.getAttribute('data-series') !== f; });
        track.scrollLeft = 0;
        ends();
      });
    });
    ends();
  }
  // Spellbook home: every post and case study in one grid; chips show one series, and ?f=spells opens on that series.
  var book = document.querySelector('[data-book]');
  if (book) {
    var bookItems = book.querySelectorAll('.issue'), bookChips = book.querySelectorAll('.chip');
    var pick = function (f) {
      if (!book.querySelector('.chip[data-f="' + f + '"]')) f = 'all';
      bookChips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-f') === f ? 'true' : 'false'); });
      bookItems.forEach(function (p) { p.hidden = f !== 'all' && p.getAttribute('data-series') !== f; });
    };
    book.querySelector('.shelf-bar').hidden = false;
    bookChips.forEach(function (chip) { chip.addEventListener('click', function () { pick(chip.getAttribute('data-f')); }); });
    var m = /[?&]f=([a-z]+)/.exec(location.search);
    if (m) pick(m[1]);
  }
  // Sections marked data-anim play their entrance (bars grow, the scenic route draws) once they scroll into view.
  document.documentElement.classList.add('js');
  var anims = document.querySelectorAll('[data-anim]');
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); seen.unobserve(en.target); } });
    }, { threshold: 0.1 });
    anims.forEach(function (el) { seen.observe(el); });
  } else {
    anims.forEach(function (el) { el.classList.add('in'); });
  }
})();

// Flip cards (Rarecraft list, results): tap or click flips a card in place; tapping the back (not its link) or moving away flips it home
document.querySelectorAll('.flipcard').forEach(function (card) {
  var front = card.querySelector('.fc-front'), back = card.querySelector('.fc-back');
  var toggle = card.querySelector('.fc-toggle') || front;
  function set(on) {
    card.classList.toggle('flipped', on);
    toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) { back.removeAttribute('inert'); front.setAttribute('inert', ''); }
    else { back.setAttribute('inert', ''); front.removeAttribute('inert'); }
  }
  set(false);
  front.addEventListener('click', function () {
    set(true);
    var a = back.querySelector('a'); if (a) setTimeout(function () { a.focus({ preventScroll: true }); }, 350);
    if (window.gtag) gtag('event', 'card_flip', { card: toggle.textContent.trim().slice(0, 60) });
  });
  back.addEventListener('click', function (e) { if (!e.target.closest('a')) { set(false); toggle.focus({ preventScroll: true }); } });
  card.addEventListener('mouseleave', function () { if (card.classList.contains('flipped')) set(false); });
  back.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); toggle.focus(); } });
});
