/* ============================================================
   SCOOP NIRVANA — interactions
   preloader → nav → hero motion → reveal → flavors → showcase
   → quotes → gallery lightbox → confetti → theme → parallax
   ============================================================ */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- preloader ---------- */
  const preloader = $("#preloader");
  const hidePreloader = () => preloader && preloader.classList.add("is-done");
  window.addEventListener("load", () => setTimeout(hidePreloader, 350));
  setTimeout(hidePreloader, 2600); // safety net

  /* ---------- nav: scrolled state + burger ---------- */
  const nav = $("#nav");
  const navLinks = $("#navLinks");
  const burger = $("#navBurger");

  const onScrollNav = () => nav.classList.toggle("is-scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  burger.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  $$(".nav__link").forEach((l) =>
    l.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      burger.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- nav: sliding blob + scrollspy ---------- */
  const blob = $(".nav__blob");
  const linkEls = $$(".nav__link");
  function moveBlob(el) {
    if (!blob || !el) return;
    blob.style.width = `${el.offsetWidth}px`;
    blob.style.transform = `translateX(${el.offsetLeft - 4}px)`;
  }
  const setActiveLink = (el) => {
    linkEls.forEach((l) => l.classList.toggle("is-active", l === el));
    moveBlob(el);
  };
  linkEls.forEach((link) => link.addEventListener("mouseenter", () => moveBlob(link)));
  linkEls.forEach((link) => link.addEventListener("click", () => setActiveLink(link)));
  const sections = ["flavors", "craft", "gallery", "joy", "visit"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const link = linkEls.find((l) => l.getAttribute("href") === `#${entry.target.id}`);
          if (link) { setActiveLink(link); nav.classList.add("is-anchored"); }
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ---------- hero word rotator ---------- */
  const rotator = $("#wordRotator");
  if (rotator) {
    const words = $$(".word-rotator__word", rotator);
    let wi = 0;
    if (reducedMotion) {
      words.slice(1).forEach((w) => w.remove());
    } else {
      setInterval(() => {
        const cur = words[wi];
        const next = words[(wi + 1) % words.length];
        cur.classList.remove("is-active");
        cur.classList.add("is-leaving");
        next.classList.remove("is-leaving");
        requestAnimationFrame(() => next.classList.add("is-active"));
        setTimeout(() => cur.classList.remove("is-leaving"), 500);
        wi = (wi + 1) % words.length;
      }, 2200);
    }
  }

  /* ---------- animated counters ---------- */
  const statNums = $$("[data-count]");
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimal = el.dataset.decimal ? 1 : 0;
    const dur = 1400;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimal);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (statNums.length) {
    const statObs = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { countUp(e.target); obs.unobserve(e.target); }
        });
      },
      { threshold: 0.6 }
    );
    statNums.forEach((el) => statObs.observe(el));
  }

  /* ---------- scroll reveal ---------- */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); revealObs.unobserve(e.target); }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => revealObs.observe(el));

  /* ---------- flavor filters ---------- */
  const chips = $$(".chip");
  const cards = $$(".flavor-card");
  let idx = 0; // stagger index for filter re-entrance
  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      chips.forEach((c) => { c.classList.toggle("is-active", c === chip); c.setAttribute("aria-selected", String(c === chip)); });
      const f = chip.dataset.filter;
      idx = 0;
      cards.forEach((card) => {
        const match = f === "all" || (card.dataset.tags || "").split(" ").includes(f);
        card.classList.toggle("is-hidden", !match);
        if (match) {
          card.style.animation = "none";
          requestAnimationFrame(() => {
            card.style.animation = `card-in 0.5s var(--ease-bounce) ${Math.min(idx * 60, 360)}ms both`;
          });
          idx += 1;
        }
      });
    })
  );

  /* ---------- 3D tilt on cards ---------- */
  if (!reducedMotion && matchMedia("(pointer:fine)").matches) {
    $$(".tilt").forEach((card) => {
      const strength = 9;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${-y * strength}deg) rotateY(${x * strength}deg) translateY(-6px)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- hero scene tilt ---------- */
  const scene = $("[data-tilt-scene]");
  const heroBlob = $(".hero__blob");
  if (scene && !reducedMotion && matchMedia("(pointer:fine)").matches) {
    scene.addEventListener("mousemove", (e) => {
      const r = scene.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      if (heroBlob) heroBlob.style.transform = `rotate(${-dx * 3}deg) translateY(${dy * -8}px)`;
    });
    scene.addEventListener("mouseleave", () => { if (heroBlob) heroBlob.style.transform = ""; });
  }

  /* ---------- scroll parallax ---------- */
  const parallaxEls = $$("[data-parallax]");
  const bgEls = $$("[data-parallax-bg]");
  let ticking = false;
  function applyParallax() {
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.1;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > vh + 100) return;
      const delta = (rect.top + rect.height / 2 - vh / 2) / vh;
      el.style.translate = `0 ${delta * speed * 90}px`;
      if (el.classList.contains("bg-decor__item")) {
        el.style.rotate = `${delta * 30}deg`;
      }
    });
    bgEls.forEach((el) => {
      const speed = parseFloat(el.dataset.parallaxBg) || 0.2;
      const r = el.parentElement.getBoundingClientRect();
      const delta = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translateY(${delta * speed * 120}px)`;
    });
    ticking = false;
  }
  function onScrollParallax() {
    if (!ticking && !reducedMotion) { requestAnimationFrame(applyParallax); ticking = true; }
  }
  window.addEventListener("scroll", onScrollParallax, { passive: true });
  applyParallax();

  /* ---------- magnetic buttons ---------- */
  if (!reducedMotion && matchMedia("(pointer:fine)").matches) {
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.32}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- quotes carousel ---------- */
  const quotes = $$(".quote");
  const dots = $$(".dot");
  let qi = 0, qTimer = null;
  function showQuote(n) {
    quotes[qi]?.classList.remove("is-active");
    dots[qi]?.classList.remove("is-active");
    qi = (n + quotes.length) % quotes.length;
    quotes[qi].classList.add("is-active");
    dots[qi].classList.add("is-active");
  }
  function startQuotes() {
    if (reducedMotion || quotes.length < 2) return;
    qTimer = setInterval(() => showQuote(qi + 1), 4500);
  }
  dots.forEach((d, n) => d.addEventListener("click", () => { showQuote(n); clearInterval(qTimer); startQuotes(); }));
  startQuotes();

  /* ---------- gallery lightbox ---------- */
  const lightbox = $("#lightbox");
  const lbImg = $("#lightboxImg");
  $$(".gallery__item img").forEach((img) =>
    img.closest(".gallery__item").addEventListener("click", () => {
      lbImg.src = img.src.replace(/w=800/, "w=1600");
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
    })
  );
  const closeLb = () => { lightbox.classList.remove("is-open"); lightbox.setAttribute("aria-hidden", "true"); };
  $("#lightboxClose").addEventListener("click", closeLb);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLb(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLb(); });

  /* ---------- cart toast + confetti ---------- */
  const toast = $("#toast");
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }
  const COLORS = ["#ff5c8a", "#ffb03a", "#8b5cf6", "#38bdf8", "#4ade80", "#f43f5e"];
  function burstConfetti(x, y) {
    if (reducedMotion) return;
    for (let i = 0; i < 36; i++) {
      const p = document.createElement("i");
      p.className = "confetti-piece";
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.background = COLORS[i % COLORS.length];
      p.style.setProperty("--cx", `${(Math.random() - 0.5) * 360}px`);
      p.style.setProperty("--cy", `${-(80 + Math.random() * 220)}px`);
      p.style.setProperty("--cr", `${(Math.random() - 0.5) * 900}deg`);
      p.style.animation = `confetti-pop ${0.8 + Math.random() * 0.7}s cubic-bezier(0.16,0.8,0.4,1) forwards`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1700);
    }
  }
  if (!document.getElementById("confetti-keyframes")) {
    const st = document.createElement("style");
    st.id = "confetti-keyframes";
    st.textContent = "@keyframes confetti-pop{to{transform:translate(var(--cx),var(--cy)) rotate(var(--cr));opacity:0}}";
    document.head.appendChild(st);
  }
  $$(".btn-cart").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const r = btn.getBoundingClientRect();
      burstConfetti(r.left + r.width / 2, r.top);
      showToast("Added to your cone 🍦");
    })
  );

  /* ---------- join form ---------- */
  const form = $("#joinForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = $("#confettiBtn");
    const r = btn.getBoundingClientRect();
    burstConfetti(r.left + r.width / 2, r.top);
    showToast("You're in! Check your inbox for the coupon 💌");
    form.reset();
  });

  /* ---------- theme toggle ---------- */
  const themeBtn = $("#themeToggle");
  const setTheme = (t) => {
    document.documentElement.dataset.theme = t;
    themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
    localStorage.setItem("scoop-theme", t);
  };
  setTheme(localStorage.getItem("scoop-theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  themeBtn.addEventListener("click", () =>
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark")
  );

  /* ---------- back to top ---------- */
  const toTop = $("#toTop");
  window.addEventListener("scroll", () => {
    toTop.classList.toggle("is-visible", window.scrollY > 700);
  }, { passive: true });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
})();
