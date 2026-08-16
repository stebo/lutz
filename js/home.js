/*
 * home.js — Startseite: Hero-Board, Bestseller-Block und Produktraster.
 */
(function () {
  'use strict';

  // Es gibt zwei Design-Fassungen (index.html / index_2.html). Jede setzt vor
  // dem Laden der Skripte window.LUTZ_PAGES, damit Links im gleichen Look bleiben.
  var PAGES = window.LUTZ_PAGES || { home: 'index.html', product: 'product.html' };

  function card(p) {
    var media = p.photo
      ? '<img src="' + p.photo + '" alt="Wakeboard ' + p.name + '" loading="lazy" width="1124" height="1055">'
      : LutzBoard.svg(p.design, { rotate: -8, ariaLabel: 'Wakeboard ' + p.name });

    var badgeClass = p.badge === 'Bestseller' ? 'badge badge--hot'
      : (p.badge === 'Neu' ? 'badge badge--new' : 'badge');

    return '<article class="card reveal">' +
      (p.badge ? '<span class="' + badgeClass + '">' + p.badge + '</span>' : '') +
      '<div class="card__media">' + media + '</div>' +
      '<div class="card__body">' +
        '<h3 class="card__name">' + p.name + '</h3>' +
        '<p class="card__tagline">' + p.tagline + '</p>' +
        '<div class="card__meta">' +
          '<span class="card__price">' +
            (p.compareAt ? '<s>' + LutzUI.euro(p.compareAt) + '</s>' : '') +
            LutzUI.euro(p.price) + '</span>' +
          LutzUI.stars(p.rating, p.reviews) +
        '</div>' +
      '</div>' +
      '<a class="card__link" href="' + PAGES.product + '?id=' + p.id + '">' +
        '<span>' + p.name + ' ansehen</span></a>' +
    '</article>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var products = LutzProducts.all;

    // Hero-Board
    var hero = document.querySelector('[data-hero-board]');
    if (hero) {
      hero.innerHTML = LutzBoard.svg(
        { base: '#101A46', accent: '#8E6BFF', rail: '#FF5A2B', pattern: 'fade', finish: 'gloss', text: '' },
        { rotate: -12, ariaLabel: 'Custom Wakeboard im Verlauf von Mitternachtsblau zu Ultraviolett' }
      );
    }

    // Bestseller-Kennzahlen
    var best = LutzProducts.byId('voltage');
    var bestPrice = document.querySelector('[data-best-price]');
    if (bestPrice && best) bestPrice.innerHTML =
      '<strong>' + LutzUI.euro(best.price) + '</strong>' +
      '<s>' + LutzUI.euro(best.compareAt) + '</s>' +
      '<em>−' + Math.round((1 - best.price / best.compareAt) * 100) + '%</em>';

    var bestList = document.querySelector('[data-best-list]');
    if (bestList && best) bestList.innerHTML = best.highlights.map(function (h) {
      return '<li>' + LutzUI.ICONS.check + '<span>' + h + '</span></li>';
    }).join('');

    // Raster
    var grid = document.querySelector('[data-product-grid]');
    if (grid) {
      grid.innerHTML = products.map(card).join('');
      LutzUI.initReveal(grid);
    }

    // Bestseller direkt in den Warenkorb
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-quick-add]');
      if (!btn || !best) return;
      LutzCart.add({
        key: best.id + '-142',
        name: best.name,
        meta: '142 cm · Hochglanz · Sofort lieferbar',
        price: best.price,
        photo: best.photo,
        href: PAGES.product + '?id=' + best.id,
        qty: 1
      });
      LutzCart.open();
    });
  });
})();
