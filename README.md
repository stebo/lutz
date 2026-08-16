# Lutz Custom Wakeboards

Design-Prototyp für einen Online-Shop, in dem man sich sein eigenes Wakeboard
zusammenstellt. Reines HTML, CSS und JavaScript — kein Build, kein Framework,
kein Backend.

## Zwei Design-Fassungen

Der Shop liegt in zwei Gestaltungen vor — gleiche Inhalte, gleiches JavaScript,
eigenes Stylesheet und eigene Seitenstruktur:

| | Design A | Design B |
|---|---|---|
| Startseite | `index.html` | `index_2.html` |
| Produktseite | `product.html` | `product_2.html` |
| Stylesheet | `css/style.css` | `css/style-2.css` |
| Grundton | dunkel, Nachtblau | weiß, sachlich |
| Akzente | Verlauf Cyan → Violett | Schwarz + Orange |
| Schrift | Space Grotesk + Inter | Inter |
| Formen | Pillen-Buttons, große Radien | eckige Buttons, feine 1-px-Linien |
| Aufbau | Generator zuerst, dann Produkte | Kopfzeile mit Suche und Kategorien, Produkte zuerst |
| Charakter | Marke und Handwerk im Vordergrund | klassischer Online-Shop |

Beide sind vollständig und einzeln hostbar. Zum Umschalten der Startseite siehe
`render.yaml`.

Damit die Fassungen sich nicht vermischen, setzt jede HTML-Datei vor dem Laden
der Skripte fest, auf welche Unterseiten sie verlinkt:

```html
<script>window.LUTZ_PAGES = { home: 'index_2.html', product: 'product_2.html' };</script>
```

## Was drin ist

| Datei | Inhalt |
|---|---|
| `index.html` / `index_2.html` | Startseite in Design A bzw. B |
| `product.html` / `product_2.html` | Produktdetailseite, liest `?id=…` (z. B. `product.html?id=nightshift`) |
| `css/style.css` / `css/style-2.css` | Je ein komplettes Design-System (Farben, Typo, Komponenten) |
| `js/board.js` | Rendert jedes Wakeboard als SVG — eine Quelle für Generator, Kacheln und Warenkorb |
| `js/products.js` | Der Katalog: sieben Boards mit Story, Preis und Design-Konfiguration |
| `js/generator.js` | Der Konfigurator: Zustand, Bedienfeld, Live-Preis |
| `js/cart.js` | Fake-Warenkorb mit Drawer, liegt im `localStorage` |
| `js/ui.js` | Icons, Header, Scroll-Reveal, Toasts |
| `js/home.js` / `js/product-page.js` | Seitenspezifisches Rendering |
| `assets/` | Logo, Favicon, Foto des Bestsellers |

## Lokal ansehen

Die Seiten laden ihre Skripte relativ, ein einfacher Webserver reicht:

```bash
cd lutz
python3 -m http.server 8080
# http://localhost:8080
```

(Direkt per Doppelklick auf `index.html` funktioniert auch, nur die
Teilen-Funktion des Generators mag `file://` nicht.)

## Auf Render.com veröffentlichen

Die `render.yaml` ist fertig konfiguriert. Zwei Wege:

**Variante A — Blueprint (empfohlen)**

1. Repo zu GitHub/GitLab pushen.
2. In Render auf **New → Blueprint**, das Repo auswählen.
3. Render liest `render.yaml` und legt eine Static Site an. **Apply** drücken.

**Variante B — von Hand**

1. **New → Static Site**, Repo auswählen.
2. *Build Command*: leer lassen.
3. *Publish Directory*: `.`
4. **Create Static Site**.

Nach dem Deploy sind beide Fassungen erreichbar (`/` und `/index_2.html`) —
praktisch, um sie am echten Gerät zu vergleichen. Wenn die Entscheidung
gefallen ist, kann die andere Fassung samt Stylesheet gelöscht werden.

Static Sites sind bei Render kostenlos und haben automatisch HTTPS. Eine eigene
Domain trägt man unter *Settings → Custom Domains* nach.

## Der Grundriss

Der Board-Umriss ist keine handgezeichnete Kurve, sondern eine Lamé-Kurve
(Superellipse):

    |x/a|^n + |y/b|^n = 1

`n = 2` wäre eine Ellipse — die sieht an Nose und Tail zu rund aus. Für
`n > 2` werden die Enden quer flacher, die Rails laufen über die Mitte fast
parallel, und es entsteht die stumpfe Tip-Form echter Boards. Im direkten
Vergleich von n = 2,0 / 2,4 / 2,8 / 3,2 trifft **n = 3** den Butterstick-/
RSP-Umriss am besten. Das Achsenverhältnis b:a = 3,24 entspricht 139 × 43 cm.

Alles steckt in `SHAPE` in `js/board.js`:

```js
var SHAPE = { cx: 100, cy: 294, a: 84, b: 272, n: 3 };
```

Zum Experimentieren gibt es `LutzBoard.setShape({ n: 2.6 })` — damit wird der
Umriss neu berechnet, und alle danach gerenderten Boards nutzen ihn.

Die Kurve wird fein abgetastet, **nach Bogenlänge gleichmäßig neu verteilt**
und dann als Catmull-Rom-Bézier ausgegeben. Ohne die Umverteilung landen bei
einem Achsenverhältnis von 3,2:1 kaum Stützpunkte an den Tips — und genau
dort bekäme die Kurve dann Ecken.

## Der Generator

Der Board-Generator zeichnet das Board komplett als SVG — keine Bilddateien,
also beliebig skalierbar und sofort umfärbbar. Konfigurierbar sind:

- **Grundfarbe**, **Grafikfarbe** und **Kante** (je 6–9 Presets plus freier Farbwähler)
- **Grafik**: Fade, Split, Circuit, Splash, Camo, High Voltage
- **Länge**: 134 / 138 / 142 / 146 cm
- **Finish**: Hochglanz oder Matt
- **Schriftzug**: bis 14 Zeichen, wird längs aufs Deck gesetzt

Der Preis rechnet live mit (Basis 549 € plus Aufschläge). Über **Design teilen**
landet die komplette Konfiguration als Query-String in der URL — der Link
öffnet den Generator mit genau diesem Board.

## Was bewusst Fake ist

- „In den Warenkorb" und „Jetzt kaufen" legen etwas in einen `localStorage`-Warenkorb,
  „Zur Kasse" zeigt nur einen Hinweis.
- Bewertungen, Stückzahlen und Lieferzeiten sind erfunden.
- Impressum, Datenschutz und AGB sind leere Links — die müssen vor einem
  echten Livegang natürlich befüllt werden.

## Bekannte Anpassungspunkte

- Produkte pflegt man in `js/products.js` (ein Objekt pro Board).
- Farbpaletten des Generators stehen oben in `js/generator.js`.
- Preise: `BASE_PRICE`, `TEXT_PRICE` und die Aufschläge in `js/board.js`.
- `assets/board-voltage.jpg` ist die zugeschnittene Fassung des Originalfotos
  (der Instagram-Sticker am unteren Rand ist weg). Das unbeschnittene Original
  liegt daneben als `board-voltage-original.jpg`.
