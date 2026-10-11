// Skill filters on the scenic route: highlight the roles and skills that carry a thread, dim the rest.
(function () {
  var chips = document.querySelectorAll('.filters .chip');
  var stops = document.querySelectorAll('.stop[data-tags]');
  var skills = document.querySelectorAll('.skills li[data-tags]');
  var learned = document.querySelectorAll('.learned');
  function has(el, f) { return el.getAttribute('data-tags').split(' ').indexOf(f) !== -1; }
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
  // Open with a thread already picked, e.g. /journey/?thread=teams from the home page cards.
  var pick = new URLSearchParams(location.search).get('thread');
  chips.forEach(function (chip) { if (pick && chip.getAttribute('data-f') === pick) chip.click(); });
})();
