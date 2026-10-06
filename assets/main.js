// Scroll-driven day: crossfades Claire's photos and updates the corner clock as each chapter reaches mid-screen.
(function () {
  var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-key][data-clock]'));
  var photos = document.querySelectorAll('.photos .ph');
  var clock = document.querySelector('.clock');
  var clockText = document.getElementById('clock-text');
  var orbs = { dawn: '#F4A07F', early: '#F7B98A', morning: '#FFE29A', midday: '#FFF2B8', golden: '#F2C46B', sunset: '#F2836B' };
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
    if (target && !target._ready) return;
    current = key;
    photos.forEach(function (ph) { ph.classList.toggle('on', ph.getAttribute('data-key') === key); });
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
    if (webp) src = src.replace(/\.jpg$/, '.webp');
    var img = new Image();
    img.onload = img.onerror = function () {
      ph.style.backgroundImage = "url('" + src + "')"; ph.removeAttribute('data-bg');
      ph._ready = true; ph._loading = false; update();
    };
    img.src = src;
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
    owl.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      if (!owlId) owlId = newId();
      var data = new FormData(owl); data.append('id', owlId);
      sending = true; btn.disabled = true; say('Sending…');
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
      var done = function () { clearTimeout(timer); sending = false; btn.disabled = false; };
      fetch(owl.action, { method: 'POST', body: data, signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'unknown' }; }); })
        .then(function (res) {
          done();
          if (res.ok) { owl.reset(); owlId = ''; btn.textContent = 'Send another owl'; say('Owl sent. I’ll write back soon.', 'ok'); }
          else if (res.error === 'missing') say('Please add your name, a valid email, and a message.', 'error');
          else { btn.textContent = 'Try again'; say('The owl didn’t make it. Your message is still here, so you can try again, or book a call above.', 'error'); }
        })
        .catch(function () {
          done(); btn.textContent = 'Try again';
          say('No word back from the owl, so it may or may not have arrived. Your message is still here. It’s safe to try again.', 'unsure');
        });
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
  // Sections marked data-anim play their entrance (bars grow, the scenic route draws) once they scroll into view.
  document.documentElement.classList.add('js');
  var anims = document.querySelectorAll('[data-anim]');
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); seen.unobserve(en.target); } });
    }, { threshold: 0.25 });
    anims.forEach(function (el) { seen.observe(el); });
  } else {
    anims.forEach(function (el) { el.classList.add('in'); });
  }
})();
