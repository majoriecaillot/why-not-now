/* Why Not Now — contact form. Posts to data-endpoint (a form service URL, see README). */
(function () {
  'use strict';

  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');

  function say(msg, kind) {
    status.textContent = msg;
    status.className = 'form-status ' + kind;
    status.hidden = false;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const email = form.elements.email;
    if (!name || !email.value.trim() || !email.checkValidity()) {
      say('Please add your name and a valid email address.', 'error');
      (!name ? form.elements.name : email).focus();
      return;
    }
    if (form.elements._gotcha.value) return; // hidden field filled in by a bot

    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      say('Thanks, ' + name + '. This form is not connected to an inbox yet, so your message was not sent.', 'error');
      return;
    }
    button.disabled = true;
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      say('Thank you. Your message has been sent.', 'ok');
    } catch (err) {
      console.error('Contact form submission failed:', err);
      say('Your message could not be sent. Please try again in a moment.', 'error');
    } finally {
      button.disabled = false;
    }
  });
})();
