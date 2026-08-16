/*
 * generator.js — Der Board-Konfigurator.
 * Baut das Bedienfeld aus den Paletten unten auf, hält den Zustand und
 * rendert bei jeder Änderung Vorschau + Preis neu.
 */
(function (global) {
  'use strict';

  var KEY = 'lutz.design.v1';

  var BASES = [
    { hex: '#101A46', name: 'Midnight' },
    { hex: '#0C1018', name: 'Blackout' },
    { hex: '#0A1E4A', name: 'Deep Ocean' },
    { hex: '#0B2B33', name: 'Petrol' },
    { hex: '#123A2E', name: 'Forest' },
    { hex: '#3A2350', name: 'Aubergine' },
    { hex: '#B3123C', name: 'Crimson' },
    { hex: '#FF7A18', name: 'Sunset' },
    { hex: '#EDEAE1', name: 'Off-White' }
  ];

  var ACCENTS = [
    { hex: '#8E6BFF', name: 'Ultraviolett' },
    { hex: '#22E1FF', name: 'Elektrik-Cyan' },
    { hex: '#C0298A', name: 'Magenta' },
    { hex: '#B8FF3C', name: 'Volt-Lime' },
    { hex: '#FF5A2B', name: 'Coral' },
    { hex: '#4FE0A8', name: 'Mint' },
    { hex: '#FFC53D', name: 'Gold' },
    { hex: '#1B4DF5', name: 'Kobalt' },
    { hex: '#FFFFFF', name: 'Weiß' }
  ];

  var RAILS = [
    { hex: '#FF5A2B', name: 'Coral' },
    { hex: '#22E1FF', name: 'Cyan' },
    { hex: '#F2EFE6', name: 'Weiß' },
    { hex: '#0B0F1A', name: 'Schwarz' },
    { hex: '#B8FF3C', name: 'Lime' },
    { hex: '#7C5CFF', name: 'Violett' }
  ];

  var DEFAULT = {
    base: '#101A46',
    accent: '#8E6BFF',
    rail: '#FF5A2B',
    pattern: 'fade',
    finish: 'gloss',
    size: 138,
    text: ''
  };

  var state = Object.assign({}, DEFAULT);
  var root;

  /* ---------- Zustand ---------- */

  function loadState() {
    // 1. URL schlägt alles (geteilte Designs)
    var params = new URLSearchParams(location.search);
    if (params.get('base')) {
      state = LutzBoard.normalize({
        base: '#' + String(params.get('base')).replace('#', ''),
        accent: '#' + String(params.get('accent') || '8E6BFF').replace('#', ''),
        rail: '#' + String(params.get('rail') || 'FF5A2B').replace('#', ''),
        pattern: params.get('pattern'),
        finish: params.get('finish'),
        size: Number(params.get('size')) || 138,
        text: params.get('text') || ''
      });
      return;
    }
    // 2. Sonst der letzte Stand aus dieser Sitzung
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) state = Object.assign({}, DEFAULT, JSON.parse(raw));
    } catch (e) { /* egal */ }
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* egal */ }
  }

  function set(patch) {
    Object.assign(state, patch);
    persist();
    update();
  }

  function shareUrl() {
    var base = location.origin + location.pathname;
    var q = new URLSearchParams({
      base: state.base.replace('#', ''),
      accent: state.accent.replace('#', ''),
      rail: state.rail.replace('#', ''),
      pattern: state.pattern,
      finish: state.finish,
      size: String(state.size),
      text: state.text
    });
    return base + '?' + q.toString() + '#generator';
  }

  /* ---------- Markup-Bausteine ---------- */

  function swatchRow(list, field, label) {
    var html = '<div class="field"><span class="field-label">' + label + '</span><div class="swatches">';
    html += list.map(function (c) {
      return '<button type="button" class="swatch" data-field="' + field + '" data-value="' + c.hex +
        '" style="background:' + c.hex + '" title="' + c.name + '" aria-label="' + label + ': ' + c.name +
        '" aria-pressed="false"></button>';
    }).join('');
    html += '<label class="swatch swatch--custom" title="Eigene Farbe">' +
      '<span>+</span><input type="color" data-color-field="' + field + '" ' +
      'aria-label="' + label + ': eigene Farbe wählen"></label>';
    return html + '</div></div>';
  }

  function patternOptions() {
    return Object.keys(LutzBoard.PATTERNS).map(function (k) {
      var p = LutzBoard.PATTERNS[k];
      return '<button type="button" class="option" data-field="pattern" data-value="' + k +
        '" aria-pressed="false"><b>' + p.label + '</b><small>' + p.hint +
        (p.surcharge ? ' <span class="surcharge">+' + p.surcharge + ' €</span>' : '') +
        '</small></button>';
    }).join('');
  }

  function sizeOptions() {
    return LutzBoard.SIZES.map(function (s) {
      return '<button type="button" class="option" data-field="size" data-value="' + s.value +
        '" aria-pressed="false"><b>' + s.label + '</b><small>' + s.rider +
        (s.surcharge ? ' · <span class="surcharge">+' + s.surcharge + ' €</span>' : '') +
        '</small></button>';
    }).join('');
  }

  function finishOptions() {
    return LutzBoard.FINISHES.map(function (f) {
      return '<button type="button" class="option" data-field="finish" data-value="' + f.value +
        '" aria-pressed="false"><b>' + f.label + '</b><small>' + f.hint +
        (f.surcharge ? ' <span class="surcharge">+' + f.surcharge + ' €</span>' : '') +
        '</small></button>';
    }).join('');
  }

  function panelMarkup() {
    return '' +
      '<div class="gen__step">' +
        '<div class="gen__step-head"><span class="gen__step-no">1</span><h3>Farben</h3>' +
        '<span>Deck, Grafik &amp; Kante</span></div>' +
        swatchRow(BASES, 'base', 'Grundfarbe') +
        swatchRow(ACCENTS, 'accent', 'Grafikfarbe') +
        swatchRow(RAILS, 'rail', 'Kante / Rails') +
      '</div>' +

      '<div class="gen__step">' +
        '<div class="gen__step-head"><span class="gen__step-no">2</span><h3>Grafik</h3></div>' +
        '<div class="options options--3">' + patternOptions() + '</div>' +
      '</div>' +

      '<div class="gen__step">' +
        '<div class="gen__step-head"><span class="gen__step-no">3</span><h3>Größe &amp; Finish</h3></div>' +
        '<div class="field"><span class="field-label">Boardlänge</span>' +
          '<div class="options options--4">' + sizeOptions() + '</div></div>' +
        '<div class="field"><span class="field-label">Oberfläche</span>' +
          '<div class="options options--2">' + finishOptions() + '</div></div>' +
      '</div>' +

      '<div class="gen__step">' +
        '<div class="gen__step-head"><span class="gen__step-no">4</span><h3>Dein Schriftzug</h3>' +
        '<span>+' + LutzBoard.TEXT_PRICE + ' €</span></div>' +
        '<input class="text-input" type="text" maxlength="14" data-text-input ' +
          'placeholder="z. B. LUTZ oder DEIN NAME" aria-label="Schriftzug auf dem Board">' +
        '<div class="field-hint"><span>Wird lackiert, nicht geklebt.</span>' +
          '<span><b data-text-count>0</b>/14</span></div>' +
      '</div>' +

      '<div class="gen__footer">' +
        '<div class="price-row">' +
          '<div><small>Dein Preis inkl. MwSt.</small>' +
            '<div class="price" data-price>—</div></div>' +
          '<div style="text-align:right"><small>Lieferzeit</small>' +
            '<div style="font-weight:600">3–4 Wochen</div></div>' +
        '</div>' +
        '<div class="gen__actions">' +
          '<button class="btn btn--primary" type="button" data-gen-add>In den Warenkorb</button>' +
          '<button class="btn btn--ghost" type="button" data-gen-random>' +
            '<span data-icon="dice"></span> Überrasch mich</button>' +
          '<button class="btn btn--ghost" type="button" data-gen-share>Design teilen</button>' +
          '<button class="btn btn--ghost btn--sm" type="button" data-gen-reset ' +
            'aria-label="Zurücksetzen"><span data-icon="refresh"></span></button>' +
        '</div>' +
      '</div>';
  }

  /* ---------- Rendern ---------- */

  function designName() {
    var p = LutzBoard.PATTERNS[state.pattern].label;
    return state.text.trim() ? '„' + state.text.trim().toUpperCase() + '“ Custom' : 'Custom ' + p;
  }

  function update() {
    var stage = root.querySelector('[data-gen-stage]');
    stage.innerHTML = LutzBoard.svg(state, {
      rotate: -6,
      ariaLabel: 'Vorschau deines Wakeboards: ' + designName()
    });
    // Das Leuchten hinter dem Board übernimmt die Grafikfarbe
    stage.style.setProperty('--preview-glow', state.accent);

    // Aktive Zustände
    root.querySelectorAll('[data-field]').forEach(function (btn) {
      var f = btn.getAttribute('data-field');
      var v = btn.getAttribute('data-value');
      var active = String(state[f]) === v;
      btn.setAttribute('aria-pressed', String(active));
    });

    // Chips
    var chips = root.querySelector('[data-gen-chips]');
    if (chips) {
      chips.innerHTML =
        chip(state.base, 'Deck') + chip(state.accent, 'Grafik') + chip(state.rail, 'Kante') +
        '<span class="chip"><b>' + LutzBoard.PATTERNS[state.pattern].label + '</b></span>' +
        '<span class="chip"><b>' + state.size + ' cm</b></span>' +
        '<span class="chip"><b>' + (state.finish === 'gloss' ? 'Hochglanz' : 'Matt') + '</b></span>';
    }

    var title = root.querySelector('[data-gen-name]');
    if (title) title.textContent = designName();

    var priceEl = root.querySelector('[data-price]');
    if (priceEl) priceEl.textContent = LutzUI.euro(LutzBoard.price(state));

    var input = root.querySelector('[data-text-input]');
    if (input && input.value !== state.text) input.value = state.text;
    var counter = root.querySelector('[data-text-count]');
    if (counter) counter.textContent = String(state.text.length);
  }

  function chip(hex, label) {
    return '<span class="chip"><span class="chip__dot" style="background:' + hex + '"></span>' +
      label + ' <b>' + hex.toUpperCase() + '</b></span>';
  }

  function randomize() {
    var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
    var patterns = Object.keys(LutzBoard.PATTERNS);
    set({
      base: pick(BASES).hex,
      accent: pick(ACCENTS).hex,
      rail: pick(RAILS).hex,
      pattern: pick(patterns),
      finish: pick(['gloss', 'matte']),
      size: pick(LutzBoard.SIZES).value
    });
  }

  /* ---------- Start ---------- */

  function init() {
    root = document.querySelector('[data-generator]');
    if (!root) return;

    loadState();
    root.querySelector('[data-gen-panel]').innerHTML = panelMarkup();

    root.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-field]');
      if (opt) {
        var f = opt.getAttribute('data-field');
        var v = opt.getAttribute('data-value');
        var patch = {};
        patch[f] = f === 'size' ? Number(v) : v;
        return set(patch);
      }

      if (e.target.closest('[data-gen-random]')) return randomize();

      if (e.target.closest('[data-gen-reset]')) return set(Object.assign({}, DEFAULT));

      if (e.target.closest('[data-gen-share]')) {
        var url = shareUrl();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            LutzUI.toast('Link zu deinem Design kopiert.');
          }, function () {
            history.replaceState(null, '', url);
            LutzUI.toast('Design steht jetzt in der Adresszeile.');
          });
        } else {
          history.replaceState(null, '', url);
          LutzUI.toast('Design steht jetzt in der Adresszeile.');
        }
        return;
      }

      if (e.target.closest('[data-gen-add]')) {
        LutzCart.add({
          key: 'custom-' + [state.base, state.accent, state.rail, state.pattern, state.finish,
            state.size, state.text].join('-'),
          name: designName(),
          meta: LutzBoard.PATTERNS[state.pattern].label + ' · ' + state.size + ' cm · ' +
            (state.finish === 'gloss' ? 'Hochglanz' : 'Matt'),
          price: LutzBoard.price(state),
          design: Object.assign({}, state),
          qty: 1
        });
        LutzCart.open();
      }
    });

    root.addEventListener('input', function (e) {
      var color = e.target.closest('[data-color-field]');
      if (color) {
        var patch = {};
        patch[color.getAttribute('data-color-field')] = color.value;
        return set(patch);
      }
      if (e.target.matches('[data-text-input]')) {
        set({ text: e.target.value.slice(0, 14) });
      }
    });

    update();

    // Icons in den frisch gebauten Buttons nachziehen
    root.querySelectorAll('[data-icon]').forEach(function (el) {
      var name = el.getAttribute('data-icon');
      if (LutzUI.ICONS[name]) el.innerHTML = LutzUI.ICONS[name];
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  global.LutzGenerator = { state: function () { return Object.assign({}, state); } };
})(window);
