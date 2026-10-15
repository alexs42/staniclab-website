/**
 * Contact obfuscation for casual harvesters, not cryptography or bot-proof access.
 * enc1: reverse the string, shift each UTF-16 code unit by +7, then base64
 * encode the UTF-8 bytes. Only decode public contact details after the check.
 * Shared by the browser gate, local admin panel, and Node encoding helper.
 */
(function() {
  'use strict';

  const sessionKey = 'staniclab.contact.revealed';
  const reverse = value => Array.from(value).reverse().join('');
  const shift = (value, offset) => value.split('').map(character =>
    String.fromCharCode(character.charCodeAt(0) + offset)
  ).join('');

  function encode(value) {
    const bytes = new TextEncoder().encode(shift(reverse(String(value)), 7));
    return 'enc1:' + btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
  }

  function decode(value) {
    if (typeof value !== 'string' || !value.startsWith('enc1:')) return '';
    try {
      const bytes = Uint8Array.from(atob(value.slice(5)), character => character.charCodeAt(0));
      return reverse(shift(new TextDecoder('utf-8', { fatal: true }).decode(bytes), -7));
    } catch {
      return '';
    }
  }

  function mount(region, contact) {
    const html = window.escapeHtml;
    region.classList.add('contact-gate');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');

    function reveal(focus) {
      const email = decode(contact.emailEnc);
      const phone = decode(contact.phoneEnc);
      const links = [
        email ? '<a href="' + html(window.safeHref('mailto:' + email)) + '">' + html(email) + '</a>' : '',
        phone ? '<a href="' + html(window.safeHref('tel:' + phone)) + '">' + html(phone) + '</a>' : ''
      ].filter(Boolean);
      region.innerHTML = '<p class="contact-gate-details">' + links.join('<br>') + '</p>';
      if (focus) region.querySelector('a')?.focus();
    }

    try {
      if (window.sessionStorage.getItem(sessionKey) === 'true') {
        reveal(false);
        return;
      }
    } catch { /* The check still works when storage is unavailable. */ }

    region.innerHTML = '<button type="button" class="btn btn-primary">Show contact details</button>';
    region.querySelector('button').addEventListener('click', () => {
      region.innerHTML = `
        <form class="contact-gate-form">
          <p id="contact-gate-explanation">To keep this address away from automated harvesters, please answer:</p>
          <label for="contact-gate-answer" id="contact-gate-question"></label>
          <div class="contact-gate-controls">
            <input id="contact-gate-answer" name="answer" type="number" inputmode="numeric" step="1" required autocomplete="off" aria-describedby="contact-gate-explanation contact-gate-error">
            <button type="submit" class="btn btn-primary">Reveal</button>
          </div>
          <p id="contact-gate-error"></p>
        </form>`;
      const input = region.querySelector('input');
      const question = region.querySelector('label');
      const error = region.querySelector('#contact-gate-error');
      let previous = -1;
      let answer;

      function newQuestion() {
        // Choose uniformly from 81 pairs, excluding the last pair on retries.
        let pair = Math.floor(Math.random() * (previous < 0 ? 81 : 80));
        if (previous >= 0 && pair >= previous) pair += 1;
        previous = pair;
        const first = Math.floor(pair / 9) + 1;
        const second = pair % 9 + 1;
        answer = first + second;
        question.innerHTML = html('What is ' + first + ' + ' + second + '?');
        input.value = '';
        input.focus();
      }

      region.querySelector('form').addEventListener('submit', event => {
        event.preventDefault();
        if (input.value.trim() !== '' && Number(input.value) === answer) {
          try { window.sessionStorage.setItem(sessionKey, 'true'); }
          catch { /* Revealing does not require storage permission. */ }
          reveal(true);
        } else {
          error.innerHTML = html('That is not right, try again.');
          input.setAttribute('aria-invalid', 'true');
          newQuestion();
        }
      });
      input.addEventListener('input', () => input.removeAttribute('aria-invalid'));
      newQuestion();
    });
  }

  const ContactGate = { encode, decode, mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = ContactGate;
  if (typeof window !== 'undefined') window.ContactGate = ContactGate;
})();
