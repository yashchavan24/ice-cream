import React, { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const flavors = [
  { name: 'Salted Honey', note: 'wildflower honey · sea salt', className: 'honey', number: '01' },
  { name: 'Strawberry Fields', note: 'roasted strawberry · pink pepper', className: 'strawberry', number: '02' },
  { name: 'Pistachio Cloud', note: 'Sicilian pistachio · olive oil', className: 'pistachio', number: '03' },
];

function Arrow({ down = false }) {
  return <span className={down ? 'arrow arrow--down' : 'arrow'} aria-hidden="true">↗</span>;
}

function Logo() {
  return (
    <a className="logo" href="#top" aria-label="Sundae Society home">
      <span className="logo-mark" aria-hidden="true">✳</span>
      <span>Sundae<br /><em>Society</em></span>
    </a>
  );
}

function IceCream({ compact = false }) {
  return (
    <div className={`ice-cream ${compact ? 'ice-cream--compact' : ''}`} aria-label="A three-scoop ice cream sundae with pistachio, strawberry, and vanilla scoops" role="img">
      <div className="sundae-shadow" />
      <div className="scoop scoop--pistachio"><i /><b /></div>
      <div className="scoop scoop--strawberry"><i /><b /></div>
      <div className="scoop scoop--vanilla"><i /><b /></div>
      <div className="cherry"><span /></div>
      <div className="cone"><span /><span /><span /><span /></div>
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const flavorRail = useRef(null);

  useEffect(() => {
    const nodes = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    nodes.forEach((node) => observer.observe(node));

    const tiltCards = document.querySelectorAll('[data-tilt]');
    const moveCard = (event) => {
      const card = event.currentTarget;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      card.style.setProperty('--tilt-x', `${x * 5}deg`);
      card.style.setProperty('--tilt-y', `${y * -5}deg`);
    };
    const resetCard = (event) => {
      event.currentTarget.style.setProperty('--tilt-x', '0deg');
      event.currentTarget.style.setProperty('--tilt-y', '0deg');
    };
    tiltCards.forEach((card) => {
      card.addEventListener('pointermove', moveCard);
      card.addEventListener('pointerleave', resetCard);
    });
    return () => {
      observer.disconnect();
      tiltCards.forEach((card) => {
        card.removeEventListener('pointermove', moveCard);
        card.removeEventListener('pointerleave', resetCard);
      });
    };
  }, []);

  const scrollRail = (amount) => flavorRail.current?.scrollBy({ left: amount, behavior: 'smooth' });

  return (
    <div className="site-shell" id="top">
      <header className="site-header">
        <Logo />
        <nav id="main-navigation" className={menuOpen ? 'nav nav--open' : 'nav'} aria-label="Main navigation">
          <a href="#flavors" onClick={() => setMenuOpen(false)}>Flavors</a>
          <a href="#story" onClick={() => setMenuOpen(false)}>Our story</a>
          <a href="#visit" onClick={() => setMenuOpen(false)}>Find us</a>
        </nav>
        <a className="header-cta" href="#visit">Order a scoop <Arrow /></a>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span /><b className="sr-only">Toggle menu</b>
        </button>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow reveal">Small batch / big feeling <span>✦</span></p>
            <h1 id="hero-title" className="hero-title reveal">Stay for<br /><em>dessert.</em></h1>
            <p className="hero-intro reveal">Ridiculously good ice cream for the soft-hearted and the wildly curious. Made slowly in Brooklyn, enjoyed everywhere.</p>
            <div className="hero-actions reveal">
              <a className="button button--light" href="#flavors">Explore the flavors <Arrow /></a>
              <a className="text-link" href="#story">Why Sundae Society <Arrow /></a>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit art-orbit--one" />
            <div className="art-orbit art-orbit--two" />
            <span className="art-note art-note--top">Handcrafted<br />with joy</span>
            <span className="art-note art-note--bottom">Est. 2017<br /><i>Brooklyn, NY</i></span>
            <IceCream />
          </div>
          <div className="hero-stamp" aria-hidden="true"><span>100%</span><small>good<br />mood</small></div>
          <a className="scroll-cue" href="#flavors"><span>Scroll to scoop</span><Arrow down /></a>
        </section>

        <div className="marquee" aria-label="Sundae Society values">
          <div className="marquee-track">
            <span>Real ingredients</span><i>✳</i><span>Made with mischief</span><i>✳</i><span>Slow churned daily</span><i>✳</i><span>Real ingredients</span><i>✳</i><span>Made with mischief</span><i>✳</i>
          </div>
        </div>

        <section className="flavors section" id="flavors" aria-labelledby="flavors-title">
          <div className="section-heading reveal">
            <div><p className="eyebrow">The flavor index</p><h2 id="flavors-title">Pick your<br /><em>happy place.</em></h2></div>
            <p className="section-description">Thoughtfully layered, never overly sweet. Three scoops of our current obsession.</p>
          </div>
          <div className="flavor-controls">
            <button type="button" aria-label="Previous flavors" onClick={() => scrollRail(-360)}>←</button>
            <button type="button" aria-label="Next flavors" onClick={() => scrollRail(360)}>→</button>
          </div>
          <div className="flavor-rail" ref={flavorRail}>
            {flavors.map((flavor) => (
              <article className="flavor-card reveal" data-tilt key={flavor.name}>
                <div className={`flavor-art ${flavor.className}`} aria-hidden="true"><div className="mini-scoop" /><div className="mini-scoop mini-scoop--back" /><span className="flavor-spark">✦</span></div>
                <div className="flavor-meta"><span>{flavor.number}</span><span>4.8 / 5 ★</span></div>
                <h3>{flavor.name}</h3><p>{flavor.note}</p><a href="#visit" className="card-link">Taste this <Arrow /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="story section" id="story" aria-labelledby="story-title">
          <div className="story-visual reveal"><div className="story-circle" /><div className="story-copy-art">Scoop<br /><em>slowly</em><br />& smile</div><span className="vertical-label">The Sundae Society way</span></div>
          <div className="story-text reveal"><p className="eyebrow">A little more feeling</p><h2 id="story-title">Ice cream is<br /><em>a love language.</em></h2><p>We believe dessert should feel like a tiny celebration. So we source the good stuff, let it shine, and churn every batch with the kind of patience you can taste.</p><p>From our first neighborhood scoop shop to your freezer, the recipe stays simple: be generous, stay curious, and always save room.</p><a className="button button--dark" href="#visit">Meet the society <Arrow /></a></div>
        </section>

        <section className="quality section" aria-labelledby="quality-title">
          <div className="quality-heading reveal"><p className="eyebrow">The good stuff</p><h2 id="quality-title">Nothing weird.<br /><em>Everything wonderful.</em></h2></div>
          <div className="quality-grid">
            <div className="quality-item reveal"><span className="quality-icon">✳</span><strong>Milk from<br />happy cows</strong><p>Local dairy, always organic, never powdered.</p></div>
            <div className="quality-item reveal"><span className="quality-icon">◒</span><strong>Fruit at<br />its peak</strong><p>Real berries, roasted and folded in by hand.</p></div>
            <div className="quality-item reveal"><span className="quality-icon">〰</span><strong>Slow is<br />the secret</strong><p>Small-batch churned for a silkier spoonful.</p></div>
          </div>
        </section>

        <section className="visit section" id="visit" aria-labelledby="visit-title">
          <div className="visit-inner reveal"><p className="eyebrow">Come on over</p><h2 id="visit-title">Your next<br /><em>favorite scoop</em><br />is waiting.</h2><p>Find us in Brooklyn, or bring the good mood home with a pint (or three).</p><div className="visit-actions"><a className="button button--light" href="mailto:hello@sundaesociety.com">Order for pickup <Arrow /></a><a className="text-link text-link--light" href="https://maps.google.com" target="_blank" rel="noreferrer">Get directions <Arrow /></a></div></div>
          <div className="visit-doodle" aria-hidden="true">✳</div>
        </section>
      </main>

      <footer className="site-footer"><Logo /><p>Good things take time.<br />Good ice cream takes a little less.</p><div className="footer-links"><a href="#top">Instagram</a><a href="mailto:hello@sundaesociety.com">Say hello</a><a href="#top">Back to top ↑</a></div><small>© 2024 Sundae Society. Made for lingering.</small></footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
