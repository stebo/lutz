/*
 * product-page.js — Produktdetailseite.
 * Liest ?id=… aus der URL und baut daraus Galerie, Kaufbereich und Specs.
 */
(function () {
  'use strict';

  var PAGES = window.LUTZ_PAGES || { home: 'index.html', product: 'product.html' };

  var product, size, qty = 1, views = [], activeView = 0;

  function views_for(p) {
    var list = [];
    if (p.photo) list.push({ type: 'photo', src: p.photo });
    list.push({ type: 'board', cfg: p.design, rotate: -6 });
    list.push({ type: 'board', cfg: Object.assign({}, p.design, { text: p.name.toUpperCase() }), rotate: -6 });
    list.push({
      type: 'board',
      cfg: Object.assign({}, p.design, { finish: p.design.finish === 'gloss' ? 'matte' : 'gloss' }),
      rotate: 8
    });
    return list.slice(0, 4);
  }

  function renderView(v, opts) {
    if (v.type === 'photo') {
      return '<img src="' + v.src + '" alt="Wakeboard ' + product.name + '" width="1124" height="1055">';
    }
    return LutzBoard.svg(v.cfg, {
      rotate: v.rotate,
      shadow: opts && opts.shadow === false ? false : true,
      ariaLabel: 'Wakeboard ' + product.name
    });
  }

  function renderGallery() {
    document.querySelector('[data-gallery-main]').innerHTML = renderView(views[activeView]);
    document.querySelector('[data-gallery-thumbs]').innerHTML = views.map(function (v, i) {
      return '<button type="button" class="thumb" data-view="' + i + '" aria-pressed="' +
        (i === activeView) + '" aria-label="Ansicht ' + (i + 1) + '">' +
        renderView(v, { shadow: false }) + '</button>';
    }).join('');
  }

  function currentPrice() {
    var s = LutzBoard.SIZES.filter(function (x) { return x.value === size; })[0];
    return product.price + (s ? s.surcharge : 0);
  }

  function renderPrice() {
    var el = document.querySelector('[data-pdp-price]');
    el.innerHTML = '<strong>' + LutzUI.euro(currentPrice()) + '</strong>' +
      (product.compareAt ? '<s>' + LutzUI.euro(product.compareAt) + '</s>' : '') +
      '<span style="font-size:.82rem;color:var(--text-mute)">inkl. MwSt. · versandkostenfrei</span>';
  }

  function renderSizes() {
    document.querySelector('[data-pdp-sizes]').innerHTML = LutzBoard.SIZES.map(function (s) {
      return '<button type="button" class="option" data-size="' + s.value + '" aria-pressed="' +
        (s.value === size) + '"><b>' + s.label + '</b><small>' + s.rider +
        (s.surcharge ? ' · <span class="surcharge">+' + s.surcharge + ' €</span>' : '') +
        '</small></button>';
    }).join('');
  }

  function renderRelated() {
    var others = LutzProducts.all.filter(function (p) { return p.id !== product.id; }).slice(0, 4);
    document.querySelector('[data-related]').innerHTML = others.map(function (p) {
      var media = p.photo
        ? '<img src="' + p.photo + '" alt="Wakeboard ' + p.name + '" loading="lazy">'
        : LutzBoard.svg(p.design, { rotate: -8, ariaLabel: 'Wakeboard ' + p.name });
      return '<article class="card">' +
        (p.badge ? '<span class="badge' + (p.badge === 'Bestseller' ? ' badge--hot' : '') + '">' +
          p.badge + '</span>' : '') +
        '<div class="card__media">' + media + '</div>' +
        '<div class="card__body"><h3 class="card__name">' + p.name + '</h3>' +
        '<p class="card__tagline">' + p.tagline + '</p>' +
        '<div class="card__meta"><span class="card__price">' + LutzUI.euro(p.price) + '</span>' +
        LutzUI.stars(p.rating, p.reviews) + '</div></div>' +
        '<a class="card__link" href="' + PAGES.product + '?id=' + p.id + '"><span>' +
        p.name + '</span></a>' +
        '</article>';
    }).join('');
  }

  function generatorLink() {
    var d = product.design;
    var q = new URLSearchParams({
      base: d.base.replace('#', ''),
      accent: d.accent.replace('#', ''),
      rail: d.rail.replace('#', ''),
      pattern: d.pattern,
      finish: d.finish,
      size: String(size),
      text: ''
    });
    return PAGES.home + '?' + q.toString() + '#generator';
  }

  function render() {
    document.title = product.name + ' — Lutz Custom Wakeboards';
    document.querySelector('[data-pdp-crumb]').textContent = product.name;
    document.querySelector('[data-pdp-badge]').innerHTML = product.badge
      ? '<span class="badge" style="position:static">' + product.badge + '</span>' : '';
    document.querySelector('[data-pdp-title]').textContent = product.name;
    document.querySelector('[data-pdp-tagline]').textContent = product.tagline;
    document.querySelector('[data-pdp-meta]').innerHTML =
      LutzUI.stars(product.rating, product.reviews) +
      '<span>' + product.level + '</span>' +
      '<span style="color:var(--lime)">● Auf Lager</span>';
    document.querySelector('[data-pdp-story]').textContent = product.story;
    document.querySelector('[data-pdp-highlights]').innerHTML = product.highlights.map(function (h) {
      return '<li>' + LutzUI.ICONS.check + '<span>' + h + '</span></li>';
    }).join('');
    document.querySelector('[data-pdp-specs]').innerHTML =
      row('Shape', 'Symmetrisch, Continuous Rocker') +
      row('Länge', size + ' cm') +
      row('Kern', 'Paulownia-Holzkern, Glasfaser-Laminat') +
      row('Finnen', '2 × 0.8" molded-in, 2 × 1.0" schraubbar') +
      row('Oberfläche', product.design.finish === 'gloss' ? 'Hochglanz 2K-Klarlack' : 'Softtouch-Mattlack') +
      row('Inserts', '6-Loch, passend für alle gängigen Bindungen') +
      row('Gewicht', '3,1 kg (bei 142 cm)') +
      row('Fertigung', 'Handarbeit, Deutschland');
    document.querySelector('[data-gen-link]').setAttribute('href', generatorLink());

    renderGallery();
    renderSizes();
    renderPrice();
    renderRelated();
  }

  function row(k, v) {
    return '<tr><th scope="row">' + k + '</th><td>' + v + '</td></tr>';
  }

  function addToCart(thenCheckout) {
    LutzCart.add({
      key: product.id + '-' + size,
      name: product.name,
      meta: size + ' cm · ' + (product.design.finish === 'gloss' ? 'Hochglanz' : 'Matt'),
      price: currentPrice(),
      photo: product.photo || null,
      design: product.photo ? null : product.design,
      href: PAGES.product + '?id=' + product.id,
      qty: qty
    });
    LutzCart.open();
    if (thenCheckout) {
      setTimeout(function () {
        LutzUI.toast('Demo-Shop: Die Kasse ist noch nicht angeschlossen. ⚡');
      }, 500);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var id = new URLSearchParams(location.search).get('id');
    product = LutzProducts.byId(id) || LutzProducts.byId('voltage');
    size = product.design.size || 138;
    views = views_for(product);
    render();

    document.addEventListener('click', function (e) {
      var thumb = e.target.closest('[data-view]');
      if (thumb) {
        activeView = Number(thumb.getAttribute('data-view'));
        return renderGallery();
      }

      var sizeBtn = e.target.closest('[data-size]');
      if (sizeBtn) {
        size = Number(sizeBtn.getAttribute('data-size'));
        renderSizes();
        renderPrice();
        document.querySelector('[data-gen-link]').setAttribute('href', generatorLink());
        return;
      }

      var q = e.target.closest('[data-qty]');
      if (q) {
        qty = Math.max(1, Math.min(9, qty + Number(q.getAttribute('data-qty'))));
        document.querySelector('[data-qty-value]').textContent = qty;
        return;
      }

      if (e.target.closest('[data-add]')) return addToCart(false);
      if (e.target.closest('[data-buy]')) return addToCart(true);

      var acc = e.target.closest('.acc__trigger');
      if (acc) {
        var open = acc.getAttribute('aria-expanded') === 'true';
        acc.setAttribute('aria-expanded', String(!open));
        acc.nextElementSibling.classList.toggle('is-open', !open);
      }
    });
  });
})();
