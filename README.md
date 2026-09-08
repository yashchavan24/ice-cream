# 🍦 Scoop Nirvana — Ice Cream Slide-Deck Store

A single-page **slide-deck** landing page + storefront for a fictional handcrafted ice
cream brand. Plain **HTML + CSS + JS** frontend, zero-dependency **Node.js** backend.
No frameworks, no build step.

## Run it

```bash
cd ice-cream
node server.js
# Storefront → http://localhost:5175
# Admin      → http://localhost:5175/admin
```

## What's inside

**Slide-deck navigation** — the page is 7 full-screen slides (Home · Flavors ·
3D Studio · Gallery · Joy · Feedback · Visit) driven by wheel, swipe, arrow keys,
side dots, arrows and nav links. Each slide enters with its own animation:
`lift`, `flipCards`, `zoomThrough`, `panels`, `curtain`, `foldUp`, `swingIn`.

**3D Studio** — a real Three.js ice cream cone (waffle lattice, stacked scoops,
drips, 46 sprinkles, cherry) you can drag-rotate and zoom, with auto-spin and
scoop-color cycling. Graceful emoji fallback when WebGL is unavailable.

**Commerce** — cart drawer (persisted in `localStorage`), quantity controls,
tax/delivery math mirroring the server, checkout modal with 3 steps:
details → payment (UPI with QR, card, cash on delivery) → confirmation with
receipt.

**Feedback** — star rating + message form, persisted server-side, rendered in a
live feed on the same slide.

**Backend** (`server.js`, pure Node, no npm installs):
- `POST /api/orders` — validate cart, upsert customer, compute totals
- `POST /api/payments` — simulated gateway (UPI/card succeed; `simulate:"decline"` fails; cash = pay on delivery)
- `POST /api/feedback` — rating 1-5 + message
- `GET /api/orders`, `/api/payments`, `/api/feedback`, `/api/admin/stats`, `/api/health`
- JSON file storage in `./data/` (orders, payments, customers, feedback)
- Admin dashboard at `/admin` with live stats, auto-refresh every 15 s

## Motion inventory

Scoop-bounce preloader · per-slide unique transitions · sliding-blob nav ·
word rotator · stat counters · morphing blob hero with SVG-goo drips · orbiting
fruit · floating sprinkles & chips · mouse parallax · infinite marquee ·
filter chips with flip re-entry · 3D tilt cards · magnetic buttons · shine
sweeps · wiggle emojis · gallery lightbox · testimonial carousel · confetti
bursts · toasts · dark/light theme · progress rail · `prefers-reduced-motion`
respected everywhere.

## Credits

Photography from [Unsplash](https://unsplash.com) and one
[Openverse/Flickr](https://openverse.org) CC-licensed gelato photo.
Three.js r152 vendored in `vendor/`.
