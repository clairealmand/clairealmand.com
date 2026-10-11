// Skill filters on the scenic route: highlight the roles and skills that carry a thread, dim the rest.
(function () {
  var chips = document.querySelectorAll('.filters .chip');
  var stops = document.querySelectorAll('.stop[data-tags]');
  var skills = document.querySelectorAll('.skills li[data-tags]');
  var learned = document.querySelectorAll('.learned');
  function has(el, f) { return el.getAttribute('data-tags').split(' ').indexOf(f) !== -1; }
  // The summary under the chips answers "where did she do this?" without scrolling:
  // every matching role, its result, and whether a full case study exists.
  var sum = document.querySelector('.thread-sum');
  var sumHead = sum && sum.querySelector('.sum-head');
  var sumList = sum && sum.querySelector('.sum-list');
  var original = sum && [sumHead.textContent, sumList.innerHTML];
  function text(el, sel) { var n = el.querySelector(sel); return n ? n.textContent : ''; }
  function summarize(chip, f, all) {
    if (!sum) return;
    if (all) { sumHead.textContent = original[0]; sumList.innerHTML = original[1]; return; }
    var rows = [];
    stops.forEach(function (s) {
      if (!has(s, f) || !s.id) return;
      var yr = (text(s, '.yr').match(/\d{4}/) || [''])[0];
      var win = text(s, '.win') || text(s, 'h2');
      var title = text(s, 'h2').replace(/^[^:]*: /, '');
      title = title.charAt(0).toUpperCase() + title.slice(1);
      var cs = s.querySelector('a.text-link[href^="/spells/"]') ? '<i>Case study</i>' : '';
      var li = document.createElement('li');
      li.innerHTML = '<a href="#' + s.id + '"><span class="yr"></span><b></b><span class="t"></span>' + cs + '</a>';
      li.querySelector('.yr').textContent = yr;
      li.querySelector('b').textContent = win;
      li.querySelector('.t').textContent = title;
      li.dataset.yr = yr;
      rows.push(li);
    });
    rows.sort(function (x, y) { return x.dataset.yr - y.dataset.yr; });
    sumHead.textContent = chip.textContent + ': ' + rows.length + ' roles and projects';
    sumList.innerHTML = '';
    rows.forEach(function (li) { sumList.appendChild(li); });
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
      summarize(chip, f, all);
    });
  });
  // Open with a thread already picked, e.g. /journey/?thread=teams from the home page cards.
  var pick = new URLSearchParams(location.search).get('thread');
  chips.forEach(function (chip) { if (pick && chip.getAttribute('data-f') === pick) chip.click(); });
})();
