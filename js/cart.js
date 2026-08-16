/*
 * cart.js — Fake-Warenkorb.
 * Kein Backend: Der Zustand liegt im localStorage, damit man zwischen
 * Startseite und Produktseite wechseln kann, ohne dass etwas verloren geht.
 */
(function (global) {
  'use strict';

  var PAGES = window.LUTZ_PAGES || { home: 'index.html', product: 'product.html' };

  var KEY = 'lutz.cart.v1';
  var SHIPPING_FREE_FROM = 0; // Versand ist immer frei — das ist Teil der Story
  var items = [];

  /* ---------- Persistenz ---------- */

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      items = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(items)) items = [];
    } catch (e) {
      items = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) { /* Privatmodus: dann eben nur für diese Sitzung */ }
  }

  /* ---------- Rechnen ---------- */

  function count() {
    return items.reduce(function (n, i) { return n + i.qty; }, 0);
  }

  function subtotal() {
    return items.reduce(function (n, i) { return n + i.price * i.qty; }, 0);
  }

  /* ---------- Mutationen ---------- */

  function add(item) {
    var existing = items.filter(function (i) { return i.key === item.key; })[0];
    if (existing) {
      existing.qty += item.qty || 1;
    } else {
      items.push({
        key: item.key,
        name: item.name,
        meta: item.meta || '',
        price: item.price,
        qty: item.qty || 1,
        photo: item.photo || null,
        design: item.design || null,
        href: item.href || null
      });
    }
    save();
    render();
    LutzUI.toast('<b>' + item.name + '</b> liegt im Warenkorb.');
    bumpBadge();
  }

  function remove(key) {
    items = items.filter(function (i) { return i.key !== key; });
    save();
    render();
  }

  function setQty(key, qty) {
    var it = items.filter(function (i) { return i.key === key; })[0];
    if (!it) return;
    it.qty = Math.max(1, Math.min(9, qty));
    save();
    render();
  }

  function clear() {
    items = [];
    save();
    render();
  }

  /* ---------- Drawer-Markup ---------- */

  function mount() {
    if (document.querySelector('.drawer')) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    backdrop.hidden = false;

    var drawer = document.createElement('aside');
    drawer.className = 'drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Warenkorb');
    drawer.innerHTML =
      '<div class="drawer__head">' +
        '<h3>Dein Warenkorb</h3>' +
        '<button class="icon-btn" type="button" data-cart-close aria-label="Warenkorb schließen">' +
          LutzUI.ICONS.close +
        '</button>' +
      '</div>' +
      '<div class="drawer__body" data-cart-body></div>' +
      '<div class="drawer__foot" data-cart-foot></div>';

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    backdrop.addEventListener('click', close);
    drawer.addEventListener('click', function (e) {
      var closeBtn = e.target.closest('[data-cart-close]');
      if (closeBtn) return close();

      var rm = e.target.closest('[data-cart-remove]');
      if (rm) return remove(rm.getAttribute('data-cart-remove'));

      var qty = e.target.closest('[data-cart-qty]');
      if (qty) {
        var key = qty.getAttribute('data-cart-qty');
        var delta = Number(qty.getAttribute('data-delta'));
        var it = items.filter(function (i) { return i.key === key; })[0];
        if (it) setQty(key, it.qty + delta);
        return;
      }

      if (e.target.closest('[data-cart-checkout]')) {
        LutzUI.toast('Demo-Shop: Die Kasse ist noch nicht angeschlossen. ⚡');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-cart-open]')) {
        e.preventDefault();
        open();
      }
    });
  }

  function open() {
    render();
    document.querySelector('.drawer').classList.add('is-open');
    document.querySelector('.drawer-backdrop').classList.add('is-open');
    document.body.classList.add('is-locked');
    var btn = document.querySelector('[data-cart-close]');
    if (btn) btn.focus();
  }

  function close() {
    var d = document.querySelector('.drawer');
    if (!d) return;
    d.classList.remove('is-open');
    document.querySelector('.drawer-backdrop').classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  function thumb(item) {
    if (item.photo) return '<img src="' + item.photo + '" alt="">';
    return LutzBoard.svg(item.design || {}, { shadow: false, ariaLabel: item.name });
  }

  function bumpBadge() {
    var badge = document.querySelector('.cart-count');
    if (!badge) return;
    badge.style.transform = 'scale(1.35)';
    setTimeout(function () { badge.style.transform = ''; }, 200);
  }

  function render() {
    // Badge im Header
    document.querySelectorAll('.cart-count').forEach(function (badge) {
      var n = count();
      badge.textContent = String(n);
      badge.classList.toggle('is-visible', n > 0);
    });

    var body = document.querySelector('[data-cart-body]');
    var foot = document.querySelector('[data-cart-foot]');
    if (!body || !foot) return;

    if (!items.length) {
      body.innerHTML =
        '<div class="drawer__empty">' + LutzUI.ICONS.box +
        '<p>Noch nichts drin.</p>' +
        '<p style="font-size:.85rem;margin-top:8px">Bau dir im Generator dein eigenes Board — ' +
        'oder such dir eins aus dem Shop aus.</p></div>';
      foot.innerHTML =
        '<a class="btn btn--ghost btn--block" href="' + PAGES.home +
        '#generator" data-cart-close>Zum Generator</a>';
      return;
    }

    body.innerHTML = items.map(function (i) {
      return '<div class="cart-item">' +
        '<div class="cart-item__media">' + thumb(i) + '</div>' +
        '<div>' +
          '<b>' + i.name + '</b>' +
          '<small>' + i.meta + '</small>' +
          '<div class="qty" style="margin-top:8px;height:32px">' +
            '<button type="button" data-cart-qty="' + i.key + '" data-delta="-1" ' +
              'style="width:32px;height:32px" aria-label="Menge verringern">−</button>' +
            '<output style="min-width:26px">' + i.qty + '</output>' +
            '<button type="button" data-cart-qty="' + i.key + '" data-delta="1" ' +
              'style="width:32px;height:32px" aria-label="Menge erhöhen">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="cart-item__right">' +
          '<strong>' + LutzUI.euro(i.price * i.qty) + '</strong>' +
          '<button type="button" class="cart-item__remove" data-cart-remove="' + i.key + '">' +
            'entfernen</button>' +
        '</div>' +
      '</div>';
    }).join('');

    foot.innerHTML =
      '<div class="drawer__row"><span>Zwischensumme</span><span>' + LutzUI.euro(subtotal()) + '</span></div>' +
      '<div class="drawer__row"><span>Versand (DE)</span><span style="color:var(--lime)">kostenlos</span></div>' +
      '<div class="drawer__row drawer__row--total"><span>Summe</span><span>' +
        LutzUI.euro(subtotal() + SHIPPING_FREE_FROM) + '</span></div>' +
      '<button class="btn btn--primary btn--block" type="button" data-cart-checkout>' +
        'Zur Kasse</button>' +
      '<p style="font-size:.74rem;color:var(--text-mute);text-align:center;margin-top:12px">' +
        'Demo-Shop — es wird nichts bestellt und nichts bezahlt.</p>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    load();
    mount();
    render();
  });

  global.LutzCart = {
    add: add, remove: remove, setQty: setQty, clear: clear,
    open: open, close: close, count: count, subtotal: subtotal
  };
})(window);
