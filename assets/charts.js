// Spell charts draw themselves once as they scroll into view.
(function () {
  var charts = document.querySelectorAll('.chart');
  if (!charts.length) return;
  document.documentElement.classList.add('js');
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countUp(el) {
    var to = +el.getAttribute('data-count'), t0 = null;
    if (still || !window.requestAnimationFrame) return;
    function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min((t - t0) / 1600, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e).toLocaleString('en-US');
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (!still && window.requestAnimationFrame) document.querySelectorAll('.chart [data-count]').forEach(function (el) { el.textContent = '0'; });
  function play(c) {
    c.classList.add('in');
    c.querySelectorAll('.grow-chart').forEach(function (g) { g.classList.add('in'); });
    c.querySelectorAll('[data-count]').forEach(countUp);
  }
  if (!('IntersectionObserver' in window)) { charts.forEach(play); return; }
  var o = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { play(e.target); o.unobserve(e.target); } });
  }, { threshold: 0.3 });
  charts.forEach(function (c) { o.observe(c); });
})();
