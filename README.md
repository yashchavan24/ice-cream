# 🍦 Scoop Nirvana — Ice Cream Landing Page

A single-page, dependency-free landing page for a fictional handcrafted ice cream brand.
Built with plain **HTML + CSS + JavaScript** — no frameworks, no build step.

## Run it

```bash
cd ice-cream
python -m http.server 4174
# open http://127.0.0.1:4174
```

(or any static server — `npx http-server`, VS Code Live Server, etc.)

## Motion & interaction inventory

| Motion | Where |
| --- | --- |
| Scoop-bounce preloader | page load |
| Sliding blob nav + scrollspy | navbar |
| Word rotator ("happiness / swirls / magic…") | hero headline |
| Animated stat counters | hero |
| Morphing blob hero image + gooey SVG drips | hero |
| Orbiting fruit, floating sprinkles, floating chips | hero |
| Mouse-parallax scene tilt | hero visual |
| Infinite flavor marquee (pause on hover) | below hero |
| Staggered reveal-on-scroll | all sections |
| Filter chips with bounce re-entry | flavors |
| 3D tilt cards | flavor cards |
| Image zoom + tilt on hover | flavor cards |
| Parallax photo band with floating polaroids | showcase |
| Wiggle emojis on hover | craft cards |
| Masonry gallery + hover captions + lightbox | gallery |
| Auto-rotating testimonial carousel with dots | joy |
| Parallax CTA background | visit |
| Confetti burst + toast | add-to-cart & signup |
| Magnetic buttons | hero CTAs |
| Shine sweep | primary buttons |
| Dark/light theme toggle (persisted) | navbar |
| Back-to-top button | global |
| `prefers-reduced-motion` respected everywhere | global |

## Credits

Photography from [Unsplash](https://unsplash.com) (free to use) and one
[Openverse/Flickr](https://openverse.org) CC-licensed gelato photo.
