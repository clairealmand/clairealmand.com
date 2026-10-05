// Scroll-driven day: crossfades Claire's photos and updates the corner clock as each chapter reaches mid-screen.
(function () {
  var chapters = Array.prototype.slice.call(document.querySelectorAll('[data-key][data-clock]'));
  var photos = document.querySelectorAll('.photos .ph');
  var clock = document.querySelector('.clock');
  var clockText = document.getElementById('clock-text');
  var orbs = { dawn: '#F4A07F', early: '#F7B98A', morning: '#FFE29A', midday: '#FFF2B8', golden: '#F2C46B', sunset: '#F2836B' };
  var current = '';
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

  // Only the dawn photo loads up front; the rest of the sky arrives on the first scroll, or after a short pause.
  var skyLoaded = false;
  function loadSky() {
    if (skyLoaded) return;
    skyLoaded = true;
    photos.forEach(function (ph) {
      var src = ph.getAttribute('data-bg');
      if (src) { ph.style.backgroundImage = "url('" + src + "')"; ph.removeAttribute('data-bg'); }
    });
  }
  window.addEventListener('scroll', loadSky, { passive: true, once: true });
  setTimeout(loadSky, 2500);
  // "Send an owl" form: posts to /api/owl and reports back without leaving the page.
  var owl = document.querySelector('.owl-form');
  if (owl) {
    var stamp = owl.querySelector('input[name="t"]');
    if (stamp) stamp.value = String(Date.now());
    owl.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = owl.querySelector('button'), status = owl.querySelector('.owl-status');
      btn.disabled = true; status.textContent = 'Sending…';
      fetch(owl.action, { method: 'POST', body: new FormData(owl) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (res) {
          if (res.ok) { owl.reset(); status.textContent = 'Owl sent. I’ll write back soon.'; }
          else { btn.disabled = false; status.textContent = res.error === 'missing' ? 'Please add your name, email, and a message.' : 'The owl got lost. Please book a call above instead.'; }
        })
        .catch(function () { btn.disabled = false; status.textContent = 'The owl got lost. Please book a call above instead.'; });
    });
  }
})();
