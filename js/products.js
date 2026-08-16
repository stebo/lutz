/*
 * products.js — Der Katalog.
 * Ein Produkt = ein Board-Design + Story + Specs. Die Boards werden aus der
 * gleichen Konfiguration gerendert wie im Generator (siehe board.js).
 */
(function (global) {
  'use strict';

  var PRODUCTS = [
    {
      id: 'voltage',
      name: 'Voltage',
      tagline: 'Midnight Blue → Ultraviolett',
      badge: 'Bestseller',
      photo: 'assets/board-voltage.jpg',
      price: 649,
      compareAt: 749,
      rating: 4.9,
      reviews: 128,
      level: 'All-Mountain / Cable & Boot',
      story:
        'Das Board, mit dem alles angefangen hat. Ein tiefes Mitternachtsblau, das über die Länge in ' +
        'Ultraviolett kippt, dazu eine orange Kante, die man auch aus 50 Metern noch am Kicker erkennt. ' +
        'Jedes Voltage wird einzeln lackiert und poliert — die Verlaufskante sitzt bei keinem Board exakt gleich.',
      highlights: [
        'Continuous Rocker für berechenbare Pops',
        'Molded-in Fins, 2 × 0.8" — auch ohne Schrauben am Cable fahrbar',
        'Handlackierter Verlauf, Hochglanz-Klarlack',
        'Gefertigt in Deutschland, Lieferzeit 3–4 Wochen'
      ],
      design: {
        base: '#101A46', accent: '#8E6BFF', rail: '#FF5A2B',
        pattern: 'fade', finish: 'gloss', size: 142, text: ''
      }
    },
    {
      id: 'nightshift',
      name: 'Nightshift',
      tagline: 'Blackout mit Neon-Blitz',
      badge: 'Neu',
      price: 629,
      rating: 4.8,
      reviews: 41,
      level: 'Park / Advanced',
      story:
        'Für die letzte Runde nach Feierabend, wenn die Flutlichter angehen. Mattschwarzes Deck, ein ' +
        'einziger Blitz in Elektrik-Cyan — mehr braucht es nicht. Der Softtouch-Lack fühlt sich an wie ' +
        'ein Werkzeuggriff und zeigt Wasserflecken deutlich weniger als Hochglanz.',
      highlights: [
        'Softtouch-Mattlack, extrem fingerabdruckarm',
        'Verstärkte Landezone für Rail-Sessions',
        'Aggressiverer 3-Stage-Rocker',
        'Reflektierende Kante für Night-Sessions'
      ],
      design: {
        base: '#0C1018', accent: '#22E1FF', rail: '#22E1FF',
        pattern: 'bolt', finish: 'matte', size: 138, text: ''
      }
    },
    {
      id: 'sundowner',
      name: 'Sundowner',
      tagline: 'Letzte Runde vor Sonnenuntergang',
      badge: 'Entwurf',
      price: 599,
      rating: 4.7,
      reviews: 23,
      level: 'Allround / Einsteiger',
      story:
        'Warmes Orange, das in Magenta ausläuft — die Farben der letzten Session des Tages. Ein ' +
        'freundliches, verzeihendes Board mit weichem Flex, das trotzdem nicht langweilig aussieht.',
      highlights: [
        'Weicher Flex, verzeihend bei harten Landungen',
        'Leichter Paulownia-Holzkern',
        'Verlauf Orange → Magenta, Hochglanz',
        'Ideal als erstes eigenes Board'
      ],
      design: {
        base: '#FF7A18', accent: '#C0298A', rail: '#151A2E',
        pattern: 'fade', finish: 'gloss', size: 138, text: ''
      }
    },
    {
      id: 'circuit',
      name: 'Circuit',
      tagline: 'Leiterbahnen auf dem Deck',
      badge: 'Entwurf',
      price: 639,
      rating: 4.6,
      reviews: 17,
      level: 'Park / Intermediate',
      story:
        'Eine Hommage an den Schaltplan: diagonale Leiterbahnen in Cyan auf tiefem Petrol. Sieht in ' +
        'Bewegung aus, als würde Strom durch das Board laufen.',
      highlights: [
        'Diagonale Siebdruck-Optik im Klarlack versiegelt',
        'Symmetrischer Shape, beide Richtungen gleich',
        'Vier Kanäle unter der Bindung für mehr Kantengriff',
        'Kratzfester 2K-Klarlack'
      ],
      design: {
        base: '#0B2B33', accent: '#22E1FF', rail: '#0B2B33',
        pattern: 'stripes', finish: 'gloss', size: 142, text: ''
      }
    },
    {
      id: 'reef',
      name: 'Reef Camo',
      tagline: 'Getarnt, aber nicht unsichtbar',
      badge: 'Entwurf',
      price: 639,
      rating: 4.5,
      reviews: 12,
      level: 'Allround',
      story:
        'Camo in Lagunen-Türkis auf tiefem Grün. Ein Muster, das jede Delle und jeden Kratzer der ' +
        'Saison schluckt — praktisch für alle, die ihr Board wirklich benutzen.',
      highlights: [
        'Fünf-Ton-Camo, per Hand maskiert',
        'Robuste ABS-Sidewalls',
        'Mittlerer Flex, breite Tips',
        'Kratzer verschwinden optisch im Muster'
      ],
      design: {
        base: '#123A2E', accent: '#4FE0A8', rail: '#0B221B',
        pattern: 'camo', finish: 'matte', size: 142, text: ''
      }
    },
    {
      id: 'whiteout',
      name: 'Whiteout',
      tagline: 'Klare Kante, harte Diagonale',
      badge: 'Entwurf',
      price: 619,
      rating: 4.8,
      reviews: 31,
      level: 'Boat / Intermediate',
      story:
        'Reduziert auf zwei Flächen und eine Diagonale. Off-White trifft auf ein sattes Kobaltblau — ' +
        'das Board für alle, denen Verläufe zu viel sind.',
      highlights: [
        'Harte Zwei-Ton-Trennung, lackiert statt beklebt',
        'Continuous Rocker für lange, saubere Turns',
        'Kobalt-Kante mit weißem Schriftzug',
        'Auch als Ganz-Weiß-Variante konfigurierbar'
      ],
      design: {
        base: '#EDEAE1', accent: '#1B4DF5', rail: '#1B4DF5',
        pattern: 'split', finish: 'gloss', size: 138, text: ''
      }
    },
    {
      id: 'lagoon',
      name: 'Lagoon Splash',
      tagline: 'Farbe, die ins Wasser passt',
      badge: 'Entwurf',
      price: 649,
      rating: 4.7,
      reviews: 19,
      level: 'Allround / Cable',
      story:
        'Türkise Spritzer auf Tiefsee-Blau, jedes Board von Hand gegossen. Kein Board gleicht dem ' +
        'anderen — wir schicken vor dem Klarlack ein Foto zur Freigabe.',
      highlights: [
        'Pour-Painting, jedes Board ein Unikat',
        'Foto-Freigabe vor der Versiegelung',
        'Mittlerer Flex, Continuous Rocker',
        'Inklusive passendem Board-Bag'
      ],
      design: {
        base: '#0A1E4A', accent: '#31D6D0', rail: '#F2EFE6',
        pattern: 'splash', finish: 'gloss', size: 138, text: ''
      }
    }
  ];

  function byId(id) {
    return PRODUCTS.filter(function (p) { return p.id === id; })[0] || null;
  }

  global.LutzProducts = { all: PRODUCTS, byId: byId };
})(window);
