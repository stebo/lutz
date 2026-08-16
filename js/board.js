/*
 * board.js — Wakeboard-Renderer
 * Erzeugt aus einer Design-Konfiguration ein komplettes SVG (Top-View).
 * Wird vom Generator (gross), von den Produktkacheln (klein) und von der
 * Detailseite genutzt — eine Quelle, ein Look.
 */
(function (global) {
  'use strict';

  /* ---------- Farb-Helfer ---------- */

  function hexToRgb(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    var c = function (v) {
      return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    };
    return '#' + c(r) + c(g) + c(b);
  }

  /** amount > 0 hellt auf, < 0 dunkelt ab (-1 … 1) */
  function shade(hex, amount) {
    var c = hexToRgb(hex);
    var t = amount < 0 ? 0 : 255;
    var p = Math.abs(amount);
    return rgbToHex(
      c.r + (t - c.r) * p,
      c.g + (t - c.g) * p,
      c.b + (t - c.b) * p
    );
  }

  function mix(a, b, t) {
    var x = hexToRgb(a), y = hexToRgb(b);
    return rgbToHex(x.r + (y.r - x.r) * t, x.g + (y.g - x.g) * t, x.b + (y.b - x.b) * t);
  }

  /** Relative Luminanz — entscheidet, ob Text hell oder dunkel gesetzt wird. */
  function luminance(hex) {
    var c = hexToRgb(hex);
    var f = function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }

  function readableOn(hex) {
    return luminance(hex) > 0.42 ? '#0B0F1A' : '#FFFFFF';
  }

  function escapeText(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------- Geometrie ---------- */

  var W = 200;   // viewBox-Breite
  var H = 582;   // viewBox-Höhe
  var MID = 294; // Mitte der Länge — Drehpunkt für Beschriftungen

  /*
   * Der Grundriss ist eine Lamé-Kurve (Superellipse):
   *
   *     |x/a|^n + |y/b|^n = 1
   *
   * Mit n = 2 wäre es eine Ellipse — und genau die sieht an Nose und Tail
   * zu rund aus. Für n > 2 werden die Enden quer flacher, die Rails laufen
   * über die Mitte fast parallel, und es entsteht die stumpfe Tip-Form
   * echter Boards. Im Vergleich n = 2,0 / 2,4 / 2,8 / 3,2 trifft n = 3
   * den RSP-/Butterstick-Umriss am besten.
   *
   * Achsenverhältnis b:a = 3,24 — das entspricht 139 cm × 43 cm.
   */
  var SHAPE = { cx: 100, cy: 294, a: 84, b: 272, n: 4 };

  /**
   * Superellipse als glatter, geschlossener Pfad.
   * Die Parametrisierung x = a·sgn(cos t)·|cos t|^(2/n) verteilt die Punkte
   * sehr ungleich — an den Tips lägen kaum welche. Deshalb wird erst fein
   * abgetastet und danach nach Bogenlänge gleichmäßig neu verteilt, sonst
   * bekommen genau die Tips Ecken.
   */
  function lameCurve(s, samples) {
    var e = 2 / s.n;
    var raw = [];
    var i, t, ct, st;
    for (i = 0; i <= 1440; i++) {
      t = (i / 1440) * Math.PI * 2;
      ct = Math.cos(t);
      st = Math.sin(t);
      raw.push([
        s.cx + (ct < 0 ? -1 : 1) * Math.pow(Math.abs(ct), e) * s.a,
        s.cy + (st < 0 ? -1 : 1) * Math.pow(Math.abs(st), e) * s.b
      ]);
    }

    // Kumulierte Bogenlänge
    var acc = [0];
    for (i = 1; i < raw.length; i++) {
      acc.push(acc[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
    }
    var total = acc[acc.length - 1];

    // Gleichmäßig nach Bogenlänge neu abtasten
    var pts = [];
    var k = 0;
    for (i = 0; i < samples; i++) {
      var target = (i / samples) * total;
      while (k < acc.length - 2 && acc[k + 1] < target) k++;
      var span = acc[k + 1] - acc[k] || 1;
      var f = (target - acc[k]) / span;
      pts.push([
        raw[k][0] + (raw[k + 1][0] - raw[k][0]) * f,
        raw[k][1] + (raw[k + 1][1] - raw[k][1]) * f
      ]);
    }
    return smoothClosedPath(pts);
  }

  /** Punktzug als geschlossener Bézier-Pfad (Catmull-Rom → kubisch). */
  function smoothClosedPath(pts) {
    var n = pts.length;
    var num = function (v) { return v.toFixed(2); };
    var d = 'M' + num(pts[0][0]) + ' ' + num(pts[0][1]);
    for (var j = 0; j < n; j++) {
      var p0 = pts[(j - 1 + n) % n], p1 = pts[j], p2 = pts[(j + 1) % n], p3 = pts[(j + 2) % n];
      d += 'C' + num(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + num(p1[1] + (p2[1] - p0[1]) / 6) +
        ',' + num(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + num(p2[1] - (p3[1] - p1[1]) / 6) +
        ',' + num(p2[0]) + ' ' + num(p2[1]);
    }
    return d + 'Z';
  }

  var OUTLINE = lameCurve(SHAPE, 96);

  // Die Grafik-Muster sind in einem 200×660-Raster gezeichnet und werden
  // auf die Boardlänge gestaucht.
  var ART_SCALE = 570 / 660;

  var uidCounter = 0;
  function uid() {
    uidCounter += 1;
    return 'lb' + uidCounter;
  }

  /* ---------- Organische Formen ---------- */

  /** Deterministischer Zufall — gleicher Seed, gleiche Form. */
  function prng(seed) {
    var s = seed * 9301 + 49297;
    return function () {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  /**
   * Geschlossene, organisch ausgebeulte Form — Basis für Camo und Splash.
   * Punkte auf einer Ellipse mit zufälligem Radius, weich verbunden
   * (Catmull-Rom als Bézier).
   */
  function blob(cx, cy, rx, ry, seed, wobble, n) {
    var rnd = prng(seed);
    n = n || 9;
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var f = 1 - wobble / 2 + rnd() * wobble;
      pts.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]);
    }
    return smoothClosedPath(pts);
  }

  /* ---------- Grafik-Muster ---------- */

  var PATTERNS = {
    fade: {
      label: 'Fade',
      surcharge: 0,
      hint: 'Weicher Verlauf über die ganze Länge',
      fill: function (id, base, accent) {
        return (
          '<linearGradient id="' + id + '-f" x1="0" y1="0" x2="0.35" y2="1">' +
          '<stop offset="0%" stop-color="' + base + '"/>' +
          '<stop offset="34%" stop-color="' + base + '"/>' +
          '<stop offset="62%" stop-color="' + mix(base, accent, 0.5) + '"/>' +
          '<stop offset="100%" stop-color="' + accent + '"/>' +
          '</linearGradient>'
        );
      },
      overlay: function () { return ''; }
    },

    split: {
      label: 'Split',
      surcharge: 20,
      hint: 'Harte Diagonale, zwei Welten',
      fill: function (id, base) {
        return '<linearGradient id="' + id + '-f" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="' + shade(base, 0.1) + '"/>' +
          '<stop offset="100%" stop-color="' + shade(base, -0.14) + '"/></linearGradient>';
      },
      overlay: function (id, base, accent) {
        // Trennkante ungefähr auf Boardmitte, leicht schräg
        return (
          '<polygon points="-10,404 210,272 210,680 -10,680" fill="' + accent + '"/>' +
          '<polygon points="-10,404 210,272 210,290 -10,422" fill="' + shade(accent, 0.35) +
          '" opacity="0.9"/>'
        );
      }
    },

    stripes: {
      label: 'Circuit',
      surcharge: 30,
      hint: 'Diagonale Leiterbahnen',
      fill: function (id, base) {
        return '<linearGradient id="' + id + '-f" x1="0" y1="0" x2="0.3" y2="1">' +
          '<stop offset="0%" stop-color="' + shade(base, 0.12) + '"/>' +
          '<stop offset="100%" stop-color="' + shade(base, -0.2) + '"/></linearGradient>';
      },
      overlay: function (id, base, accent) {
        var out = '<g transform="rotate(-24 100 330)">';
        for (var i = -6; i < 22; i++) {
          var y = i * 42;
          var w = i % 3 === 0 ? 16 : 6;
          var op = i % 3 === 0 ? 0.95 : 0.55;
          out += '<rect x="-120" y="' + y + '" width="460" height="' + w +
            '" fill="' + accent + '" opacity="' + op + '"/>';
        }
        out += '</g>';
        return out;
      }
    },

    splash: {
      label: 'Splash',
      surcharge: 40,
      hint: 'Organische Spritzer, jedes Board ein Unikat',
      fill: function (id, base, accent) {
        return '<radialGradient id="' + id + '-f" cx="0.35" cy="0.25" r="0.95">' +
          '<stop offset="0%" stop-color="' + mix(base, accent, 0.22) + '"/>' +
          '<stop offset="100%" stop-color="' + shade(base, -0.22) + '"/></radialGradient>';
      },
      overlay: function (id, base, accent) {
        var blobs = [
          [88, 130, 66, 84, 3, 0.9],
          [132, 300, 58, 78, 11, 0.75],
          [64, 440, 56, 72, 23, 0.85],
          [120, 570, 50, 62, 37, 0.7],
          [46, 240, 40, 54, 51, 0.65]
        ];
        var out = '';
        blobs.forEach(function (b, i) {
          var col = i % 2 ? shade(accent, 0.28) : accent;
          out += '<path d="' + blob(b[0], b[1], b[2], b[3], b[4], 0.75, 11) +
            '" fill="' + col + '" opacity="' + b[5] + '"/>';
        });
        // Spritzer, die vom Guss weggeflogen sind
        var dots = [[44, 186, 7], [164, 224, 5], [36, 372, 9], [160, 438, 6],
          [58, 606, 8], [150, 132, 5], [102, 396, 4], [80, 528, 6]];
        dots.forEach(function (d, i) {
          out += '<path d="' + blob(d[0], d[1], d[2], d[2] * 1.3, 71 + i * 13, 0.8, 7) +
            '" fill="' + shade(accent, 0.32) + '" opacity="0.85"/>';
        });
        return out;
      }
    },

    camo: {
      label: 'Camo',
      surcharge: 40,
      hint: 'Lake-Camo, tarnt nur den Fahrfehler',
      fill: function (id, base) {
        return '<linearGradient id="' + id + '-f" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="' + shade(base, 0.06) + '"/>' +
          '<stop offset="100%" stop-color="' + shade(base, -0.18) + '"/></linearGradient>';
      },
      overlay: function (id, base, accent) {
        // Drei Töne, großflächig überlappend — sonst sieht Camo aus wie Erbsen.
        var spots = [
          [36, 80, 58, 48, 5], [142, 62, 54, 46, 17], [96, 178, 64, 52, 29],
          [26, 258, 52, 48, 41], [168, 246, 48, 44, 53], [112, 352, 68, 56, 67],
          [38, 430, 56, 50, 79], [154, 456, 52, 46, 91], [82, 552, 62, 52, 103],
          [166, 610, 48, 42, 117], [30, 630, 50, 44, 131]
        ];
        var out = '';
        spots.forEach(function (s, i) {
          var col = i % 3 === 0 ? shade(accent, 0.3)
            : (i % 3 === 1 ? accent : shade(accent, -0.35));
          out += '<path d="' + blob(s[0], s[1], s[2], s[3], s[4], 0.55, 10) +
            '" fill="' + col + '" opacity="0.95"/>';
        });
        return out;
      }
    },

    bolt: {
      label: 'High Voltage',
      surcharge: 50,
      hint: 'Der Lutz-Blitz, quer über das Deck',
      fill: function (id, base, accent) {
        return '<linearGradient id="' + id + '-f" x1="0.1" y1="0" x2="0.9" y2="1">' +
          '<stop offset="0%" stop-color="' + shade(base, 0.14) + '"/>' +
          '<stop offset="55%" stop-color="' + base + '"/>' +
          '<stop offset="100%" stop-color="' + mix(base, accent, 0.35) + '"/></linearGradient>';
      },
      overlay: function (id, base, accent) {
        var bolt = 'M126 96 L62 336 L104 336 L74 588 L152 300 L106 300 Z';
        return (
          '<g>' +
          '<path d="' + bolt + '" fill="' + shade(accent, -0.35) + '" opacity="0.55" transform="translate(9 12)"/>' +
          '<path d="' + bolt + '" fill="' + accent + '"/>' +
          '<path d="' + bolt + '" fill="none" stroke="' + shade(accent, 0.45) + '" stroke-width="3" opacity="0.9"/>' +
          '</g>' +
          '<circle cx="100" cy="330" r="150" fill="' + accent + '" opacity="0.10"/>'
        );
      }
    }
  };

  var SIZES = [
    { value: 134, label: '134 cm', rider: 'bis 65 kg', surcharge: 0 },
    { value: 138, label: '138 cm', rider: '60–80 kg', surcharge: 0 },
    { value: 142, label: '142 cm', rider: '75–95 kg', surcharge: 30 },
    { value: 146, label: '146 cm', rider: 'ab 90 kg', surcharge: 50 }
  ];

  var FINISHES = [
    { value: 'gloss', label: 'Hochglanz', surcharge: 0, hint: 'Nasser Look, maximale Tiefe' },
    { value: 'matte', label: 'Matt', surcharge: 40, hint: 'Softtouch-Lack, seidiger Griff' }
  ];

  var BASE_PRICE = 549;
  var TEXT_PRICE = 29;

  function normalize(cfg) {
    cfg = cfg || {};
    return {
      base: cfg.base || '#141C3A',
      accent: cfg.accent || '#7C5CFF',
      rail: cfg.rail || '#FF5A2B',
      pattern: PATTERNS[cfg.pattern] ? cfg.pattern : 'fade',
      finish: cfg.finish === 'matte' ? 'matte' : 'gloss',
      size: cfg.size || 138,
      text: (cfg.text || '').slice(0, 14),
      binding: cfg.binding || '#F2EFE6'
    };
  }

  function price(cfg) {
    cfg = normalize(cfg);
    var p = BASE_PRICE;
    p += PATTERNS[cfg.pattern].surcharge;
    var s = SIZES.filter(function (x) { return x.value === Number(cfg.size); })[0];
    if (s) p += s.surcharge;
    var f = FINISHES.filter(function (x) { return x.value === cfg.finish; })[0];
    if (f) p += f.surcharge;
    if (cfg.text.trim()) p += TEXT_PRICE;
    return p;
  }

  /**
   * Baut das SVG-Markup.
   * @param {object} cfg  Design-Konfiguration
   * @param {object} opts { className, rotate, shadow, ariaLabel }
   */
  function svg(cfg, opts) {
    cfg = normalize(cfg);
    opts = opts || {};
    var id = uid();
    var p = PATTERNS[cfg.pattern];
    var rot = opts.rotate == null ? 0 : opts.rotate;
    var pad = 60;

    var textColor = readableOn(cfg.pattern === 'fade' ? mix(cfg.base, cfg.accent, 0.5) : cfg.base);
    if (cfg.pattern === 'bolt' || cfg.pattern === 'split') textColor = '#FFFFFF';

    var out = '';
    out += '<svg class="board-svg ' + (opts.className || '') + '" viewBox="' +
      (-pad) + ' ' + (-pad / 2) + ' ' + (W + pad * 2) + ' ' + (H + pad) + '" ' +
      'role="img" aria-label="' + escapeText(opts.ariaLabel || 'Wakeboard-Design') + '" ' +
      'xmlns="http://www.w3.org/2000/svg">';

    out += '<defs>';
    out += p.fill(id, cfg.base, cfg.accent);
    out += '<clipPath id="' + id + '-clip"><path d="' + OUTLINE + '"/></clipPath>';
    // Glanzkante oben links
    out += '<linearGradient id="' + id + '-gloss" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.42"/>' +
      '<stop offset="38%" stop-color="#ffffff" stop-opacity="0.06"/>' +
      '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></linearGradient>';
    // Abdunklung zu den Rails
    out += '<radialGradient id="' + id + '-vig" cx="0.5" cy="0.5" r="0.62">' +
      '<stop offset="55%" stop-color="#000000" stop-opacity="0"/>' +
      '<stop offset="100%" stop-color="#000000" stop-opacity="0.4"/></radialGradient>';
    // Der Rocker biegt die Enden um 5–6,5 cm auf (ca. 4–5° Anstellwinkel).
    // Von oben sieht man davon nur eines: Nose und Tail fangen mehr Licht.
    out += '<linearGradient id="' + id + '-rockA" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.17"/>' +
      '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></linearGradient>';
    out += '<linearGradient id="' + id + '-rockB" x1="0" y1="1" x2="0" y2="0">' +
      '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/>' +
      '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></linearGradient>';
    out += '<filter id="' + id + '-drop" x="-40%" y="-20%" width="180%" height="150%">' +
      '<feDropShadow dx="0" dy="26" stdDeviation="26" flood-color="#02040A" flood-opacity="0.55"/>' +
      '</filter>';
    out += '</defs>';

    out += '<g transform="rotate(' + rot + ' 100 ' + MID + ')"' +
      (opts.shadow === false ? '' : ' filter="url(#' + id + '-drop)"') + '>';

    // Deck
    out += '<g clip-path="url(#' + id + '-clip)">';
    // Der Fläche liegt exakt die Bounding-Box des Umrisses zugrunde, damit die
    // Verläufe über die Boardlänge laufen und nicht über die halbe Zeichenfläche.
    var BBOX = 'x="16" y="22" width="168" height="544"';
    out += '<rect ' + BBOX + ' fill="url(#' + id + '-f)"/>';
    out += '<g transform="scale(1 ' + ART_SCALE.toFixed(3) + ')">' +
      p.overlay(id, cfg.base, cfg.accent) + '</g>';
    out += '<rect ' + BBOX + ' fill="url(#' + id + '-vig)"/>';

    if (cfg.finish === 'gloss') {
      out += '<rect ' + BBOX + ' fill="url(#' + id + '-gloss)"/>';
      // Schmaler Lichtstreifen entlang der Rail statt einer wolkigen Fläche
      out += '<path d="M46 96 C38 200 38 380 50 500 L60 494 C50 378 50 202 57 100 Z" ' +
        'fill="#ffffff" opacity="0.16"/>';
      out += '<path d="M150 150 C158 250 158 360 152 452 L146 448 C152 358 152 250 145 154 Z" ' +
        'fill="#ffffff" opacity="0.08"/>';
      out += '<rect x="16" y="22" width="168" height="86" fill="url(#' + id + '-rockA)"/>';
      out += '<rect x="16" y="480" width="168" height="86" fill="url(#' + id + '-rockB)"/>';
    } else {
      out += '<rect ' + BBOX + ' fill="#0B0F1A" opacity="0.10"/>';
    }

    // Mittellinie — bei echten Boards zeichnet sich die Kernnaht auf dem Deck ab.
    out += '<line x1="100" y1="60" x2="100" y2="522" stroke="' + shade(cfg.base, -0.55) +
      '" stroke-width="1.6" opacity="0.22"/>';

    // Inserts (Schraubmuster für die Bindung)
    var inserts = [];
    [212, 238, 264, 324, 350, 376].forEach(function (y) {
      inserts.push([78, y]);
      inserts.push([122, y]);
    });
    out += '<g opacity="0.55">';
    inserts.forEach(function (i) {
      out += '<circle cx="' + i[0] + '" cy="' + i[1] + '" r="4.2" fill="#05070D" opacity="0.55"/>';
      out += '<circle cx="' + i[0] + '" cy="' + (i[1] - 1) + '" r="3" fill="#ffffff" opacity="0.22"/>';
    });
    out += '</g>';

    // Markenzeichen + Custom-Text, längs zum Board
    out += '<g transform="rotate(-90 100 134)">' +
      '<text x="100" y="140" text-anchor="middle" fill="' + textColor + '" opacity="0.85" ' +
      'font-family="Space Grotesk, Inter, sans-serif" font-size="19" font-weight="700" ' +
      'letter-spacing="9">LUTZ</text></g>';

    if (cfg.text.trim()) {
      out += '<g transform="rotate(-90 100 454)">' +
        '<text x="100" y="462" text-anchor="middle" fill="' + textColor + '" ' +
        'font-family="Space Grotesk, Inter, sans-serif" font-size="28" font-weight="700" ' +
        'letter-spacing="5">' + escapeText(cfg.text.toUpperCase()) + '</text></g>';
    }
    out += '</g>';

    // Rails / Kante
    out += '<path d="' + OUTLINE + '" fill="none" stroke="' + shade(cfg.rail, -0.55) +
      '" stroke-width="7" opacity="0.9"/>';
    out += '<path d="' + OUTLINE + '" fill="none" stroke="' + cfg.rail + '" stroke-width="4"/>';

    out += '</g></svg>';
    return out;
  }

  /** Nur für Design-Experimente: Exponent/Achsen der Lamé-Kurve ändern. */
  function setShape(patch) {
    Object.assign(SHAPE, patch);
    OUTLINE = lameCurve(SHAPE, 96);
  }

  global.LutzBoard = {
    svg: svg,
    setShape: setShape,
    SHAPE: SHAPE,
    price: price,
    normalize: normalize,
    PATTERNS: PATTERNS,
    SIZES: SIZES,
    FINISHES: FINISHES,
    BASE_PRICE: BASE_PRICE,
    TEXT_PRICE: TEXT_PRICE,
    shade: shade,
    mix: mix,
    readableOn: readableOn
  };
})(window);
