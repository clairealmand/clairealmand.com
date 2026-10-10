(function () {
  // Spellbook signup: an email-only owl. Same anti-bot stamp and retry id as the owl form.
  document.querySelectorAll('.sub-form').forEach(function (f) {
    var t = f.querySelector('input[name="t"]'); if (t) t.value = String(Date.now());
    var b = f.querySelector('button'), st = f.querySelector('.sub-status'), busy = false, sid = '';
    var say = function (msg, kind) { st.textContent = msg; st.setAttribute('data-kind', kind || ''); };
    f.addEventListener('input', function () { sid = ''; });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      if (!sid) sid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(36).slice(2, 10);
      var data = new FormData(f); data.append('id', sid);
      busy = true; b.disabled = true; say('Signing you up…');
      fetch(f.action, { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          busy = false; b.disabled = false;
          if (res.ok) {
            // Counts the signup only; the email never goes to analytics.
            if (window.gtag) gtag('event', 'sign_up', { method: 'spellbook_email', page_path: location.pathname });
            f.reset(); sid = ''; say('You’re on the list. The next spell will find you.', 'ok');
          } else if (res.error === 'missing') say('That email doesn’t look quite right. Mind checking it?', 'error');
          else say('The sign-up didn’t go through. Please try again in a moment.', 'error');
        })
        .catch(function () { busy = false; b.disabled = false; say('No word back, so it may not have gone through. Please try again.', 'error'); });
    });
  });
})();
