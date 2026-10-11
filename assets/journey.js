// The scenic route: switch between positions and case studies, and highlight by skill.
(function () {
  var main = document.querySelector('main');
  var views = document.querySelectorAll('.view-toggle button');
  var chips = document.querySelectorAll('.filters .chip');
  var stops = document.querySelectorAll('.stop[data-tags]');
  var skills = document.querySelectorAll('.skills li[data-tags]');
  var learned = document.querySelectorAll('.learned');
  function has(el, f) { return el.getAttribute('data-tags').split(' ').indexOf(f) !== -1; }

  // Chapters with no case study step aside in the case-study view.
  document.querySelectorAll('section.ch').forEach(function (sec) {
    if (!sec.querySelector('.stop[data-kind="case"], .stop[data-kind="both"]')) sec.classList.add('no-cases');
  });

  function setView(v) {
    main.setAttribute('data-view', v);
    // Hidden chapters change which photo belongs on screen, so let the sky re-check.
    window.dispatchEvent(new Event('scroll'));
    views.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === v ? 'true' : 'false'); });
  }
  views.forEach(function (b) {
    b.addEventListener('click', function () {
      setView(b.getAttribute('data-v'));
      // If the reader has scrolled into the timeline, bring them back to its top so the change is visible.
      var sw = document.querySelector('.board-switch');
      if (sw && sw.getBoundingClientRect().top <= 20) {
        window.scrollTo({ top: Math.max(0, sw.offsetTop - 10), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
      if (window.gtag) gtag('event', 'story_view', { view: b.getAttribute('data-v') });
    });
  });

  // Pinned switch: tucks away while reading down so it never sits on the text, returns on any scroll up.
  var sw = document.querySelector('.board-switch');
  if (sw) {
    var lastY = window.scrollY, swTick = false;
    window.addEventListener('scroll', function () {
      if (swTick) return;
      swTick = true;
      requestAnimationFrame(function () {
        swTick = false;
        var y = window.scrollY, pinned = sw.getBoundingClientRect().top <= 20;
        if (!pinned || y < lastY - 4) sw.classList.remove('tucked');
        else if (y > lastY + 4) sw.classList.add('tucked');
        lastY = y;
      });
    }, { passive: true });
    sw.addEventListener('focusin', function () { sw.classList.remove('tucked'); });
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-f');
      var all = f === 'all';
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      stops.forEach(function (s) { s.classList.toggle('dim', !all && !has(s, f)); });
      skills.forEach(function (li) {
        var on = !all && has(li, f);
        li.classList.toggle('hit', on);
        li.classList.toggle('dim', !all && !on);
      });
      // A chapter's lesson stays lit when any of its skills match.
      learned.forEach(function (box) {
        box.classList.toggle('dim', !all && !box.querySelector('.skills li.hit'));
      });
    });
  });

  // Links can open a view or a thread, e.g. /journey/?view=cases or ?thread=teams.
  var q = new URLSearchParams(location.search);
  if (q.get('view') === 'cases') setView('cases');
  // A link to a case study's stop opens the case-study view.
  var target = location.hash && document.getElementById(location.hash.slice(1));
  if (target && target.getAttribute('data-kind') === 'case') { setView('cases'); target.scrollIntoView(); }
  var pick = q.get('thread');
  chips.forEach(function (chip) { if (pick && chip.getAttribute('data-f') === pick) chip.click(); });
})();
