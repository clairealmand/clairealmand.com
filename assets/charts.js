// Spell charts draw themselves once as they scroll into view.
(function () {
  var charts = document.querySelectorAll('.chart');
  if (!charts.length) return;
  document.documentElement.classList.add('js');
  if (!('IntersectionObserver' in window)) { charts.forEach(function (c) { c.classList.add('in'); }); return; }
  var o = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); } });
  }, { threshold: 0.3 });
  charts.forEach(function (c) { o.observe(c); });
})();
