// Skill filters on the scenic route: highlight the stops that carry a thread, dim the rest.
(function () {
  var chips = document.querySelectorAll('.filters .chip');
  var stops = document.querySelectorAll('.stop');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-f');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      stops.forEach(function (s) {
        var on = f === 'all' || s.getAttribute('data-tags').split(' ').indexOf(f) !== -1;
        s.classList.toggle('dim', !on);
      });
    });
  });
})();
