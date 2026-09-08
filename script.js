/* ============================================================
   SCOOP NIRVANA — app script
   deck engine → nav → hero → cart → checkout/API → feedback
   → gallery → confetti → theme → 3D bridge
   ============================================================ */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const money = (n) => "₹" + Number(n).toFixed(n % 1 ? 2 : 0);

  /* ---------------- toast ---------------- */
  const toast = $("#toast");
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  /* ---------------- confetti ---------------- */
  const COLORS = ["#ff5c8a", "#ffb03a", "#8b5cf6", "#38bdf8", "#4ade80", "#f43f5e"];
  function burstConfetti(x, y, n = 36) {
    if (reducedMotion) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "confetti-piece";
      p.style.left = `${x}px`; p.style.top = `${y}px`;
      p.style.background = COLORS[i % COLORS.length];
      p.style.setProperty("--cx", `${(Math.random() - .5) * 360}px`);
      p.style.setProperty("--cy", `${-(80 + Math.random() * 220)}px`);
      p.style.setProperty("--cr", `${(Math.random() - .5) * 900}deg`);
      p.style.animation = `confetti-pop ${.8 + Math.random() * .7}s cubic-bezier(.16,.8,.4,1) forwards`;
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

  /* ================= SLIDE DECK ENGINE ================= */
  const slides = $$(".slide");
  const dotsWrap = $("#slideDots");
  const railBar = $("#railBar");
  const arrowPrev = $("#arrowPrev");
  const arrowNext = $("#arrowNext");
  const LABELS = ["Home", "Flavors", "3D Studio", "Gallery", "Joy", "Feedback", "Visit"];
  let current = 0, animLock = false;

  slides.forEach((s, i) => {
    const d = document.createElement("button");
    d.className = "dots__dot" + (i === 0 ? " is-active" : "");
    d.dataset.label = LABELS[i] || `Slide ${i + 1}`;
    d.setAttribute("aria-label", d.dataset.label);
    d.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(d);
    s.style.setProperty("--ci", i); // per-card stagger base
  });
  const dots = $$(".dots__dot", dotsWrap);

  function updateChrome() {
    const pct = ((current + 1) / slides.length) * 100;
    railBar.style.width = pct + "%";
    dots.forEach((d, i) => d.classList.toggle("is-active", i === current));
    arrowPrev.disabled = current === 0;
    arrowNext.disabled = current === slides.length - 1;
    $$(".nav__link").forEach((l) =>
      l.classList.toggle("is-active", +l.dataset.goto === current));
    if ($$(".nav__link.is-active").length) $(".nav").classList.add("is-anchored");
    $("#toTop").classList.toggle("is-visible", current > 0);
  }

  const enterAnim = (slide, dir) => {
    if (reducedMotion) return;
    slide.classList.add("slide-entering");
    // flavor cards flip in with stagger
    if (slide.dataset.anim === "flipCards") {
      $$(".flavor-card", slide).forEach((c, i) => c.style.setProperty("--ci", i));
    }
    setTimeout(() => slide.classList.remove("slide-entering"), 900);
  };

  function goTo(n) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === current || animLock) return;
    animLock = true;
    const from = slides[current], to = slides[n];
    const done = () => {
      from.classList.remove("is-leaving");
      from.classList.remove("is-active");
      animLock = false;
    };
    to.classList.add("is-active");
    to.querySelector(".slide__inner")?.scrollTo(0, 0);
    enterAnim(to, n > current ? 1 : -1);
    if (reducedMotion) { done(); }
    else { from.classList.add("is-leaving"); setTimeout(done, 620); }
    current = n;
    updateChrome();
    if (n === 2) window.dispatchEvent(new CustomEvent("slide:3d")); // wake 3D scene
  }

  arrowPrev.addEventListener("click", () => goTo(current - 1));
  arrowNext.addEventListener("click", () => goTo(current + 1));
  $$("[data-goto]").forEach((el) =>
    el.addEventListener("click", (e) => { e.preventDefault(); goTo(+el.dataset.goto); }));

  /* wheel: one slide per gesture (unless a scrollable area is hovered) */
  let wheelAcc = 0;
  window.addEventListener("wheel", (e) => {
    if ($(".drawer.is-open") || $(".modal.is-open")) return;
    const scroller = e.target.closest?.(".slide__inner, .drawer__items, .modal__panel, .fb-feed, .gallery");
    if (scroller) {
      const canScroll = scroller.scrollHeight > scroller.clientHeight + 4;
      if (canScroll) {
        const atTop = scroller.scrollTop <= 0, atBot = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
        if (!((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBot))) return; // consume inside
      }
    }
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) > 90) { goTo(current + (wheelAcc > 0 ? 1 : -1)); wheelAcc = 0; }
  }, { passive: true });

  /* touch swipe */
  let tY = 0, tX = 0, tT = 0;
  window.addEventListener("touchstart", (e) => {
    if ($(".drawer.is-open") || $(".modal.is-open") || e.target.closest?.(".studio__stage")) return;
    tY = e.touches[0].clientY; tX = e.touches[0].clientX; tT = Date.now();
  }, { passive: true });
  window.addEventListener("touchend", (e) => {
    if (!tT) return;
    const dy = e.changedTouches[0].clientY - tY, dx = e.changedTouches[0].clientX - tX;
    if (Date.now() - tT < 600 && Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx) * 1.4) goTo(current + (dy < 0 ? 1 : -1));
    tT = 0;
  }, { passive: true });

  /* keyboard */
  window.addEventListener("keydown", (e) => {
    if ($(".modal.is-open")) { if (e.key === "Escape") closeCheckout(); return; }
    if (e.target.matches("input,textarea")) return;
    if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); goTo(current + 1); }
    if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); goTo(current - 1); }
    if (e.key === "Home") goTo(0);
    if (e.key === "End") goTo(slides.length - 1);
  });

  updateChrome();

  /* ---------------- preloader ---------------- */
  const preloader = $("#preloader");
  const hidePre = () => preloader && preloader.classList.add("is-done");
  window.addEventListener("load", () => setTimeout(hidePre, 350));
  setTimeout(hidePre, 2600);

  /* ---------------- nav (blob + burger) ---------------- */
  const burger = $("#navBurger"), navLinks = $("#navLinks");
  burger.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  $$(".nav__link").forEach((l) => l.addEventListener("click", () => {
    navLinks.classList.remove("is-open"); burger.classList.remove("is-open");
  }));

  /* ---------------- hero ---------------- */
  const rotator = $("#wordRotator");
  if (rotator && !reducedMotion) {
    const words = $$(".word-rotator__word", rotator);
    let wi = 0;
    setInterval(() => {
      const cur = words[wi], next = words[(wi + 1) % words.length];
      cur.classList.remove("is-active"); cur.classList.add("is-leaving");
      next.classList.remove("is-leaving");
      requestAnimationFrame(() => next.classList.add("is-active"));
      setTimeout(() => cur.classList.remove("is-leaving"), 500);
      wi = (wi + 1) % words.length;
    }, 2200);
  }

  const statNums = $$("[data-count]");
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count), dec = el.dataset.decimal ? 1 : 0;
    const t0 = performance.now(), dur = 1400;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  statNums.forEach((el) => { const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (countUp(e.target), io.unobserve(e.target))), { threshold: .6 }); io.observe(el); });

  /* hero tilt + parallax */
  const scene = $("[data-tilt-scene]"), heroBlob = $(".hero__blob");
  if (scene && !reducedMotion && matchMedia("(pointer:fine)").matches) {
    scene.addEventListener("mousemove", (e) => {
      const r = scene.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
      if (heroBlob) heroBlob.style.transform = `rotate(${-dx * 3}deg) translateY(${dy * -8}px)`;
    });
    scene.addEventListener("mouseleave", () => { if (heroBlob) heroBlob.style.transform = ""; });
  }
  const parallaxEls = $$("[data-parallax]");
  document.addEventListener("mousemove", (e) => {
    if (reducedMotion) return;
    const cx = innerWidth / 2, cy = innerHeight / 2;
    parallaxEls.forEach((el) => {
      const sp = parseFloat(el.dataset.parallax) || .1;
      el.style.translate = `${(e.clientX - cx) * sp * .04}px ${(e.clientY - cy) * sp * .04}px`;
    });
  });
  const bgEls = $$("[data-parallax-bg]");
  const visitSlide = $("#slide-visit");
  visitSlide?.querySelector(".slide__inner")?.addEventListener("scroll", (e) => {
    const t = e.target.scrollTop;
    bgEls.forEach((el) => { el.style.transform = `translateY(${t * .25}px)`; });
  }, { passive: true });

  /* magnetic buttons */
  if (!reducedMotion && matchMedia("(pointer:fine)").matches) {
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .32}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------------- flavors: filter + tilt ---------------- */
  const chips = $$(".flavors__filters .chip"), cards = $$(".flavor-card");
  chips.forEach((chip) => chip.addEventListener("click", () => {
    chips.forEach((c) => { c.classList.toggle("is-active", c === chip); c.setAttribute("aria-selected", String(c === chip)); });
    const f = chip.dataset.filter;
    cards.forEach((card, i) => {
      const match = f === "all" || (card.dataset.tags || "").split(" ").includes(f);
      card.classList.toggle("is-hidden", !match);
      if (match && !reducedMotion) {
        card.style.animation = "none";
        requestAnimationFrame(() => { card.style.animation = `card-flip .6s var(--ease-bounce) ${Math.min(i * 60, 300)}ms both`; });
      }
    });
  }));
  if (!reducedMotion && matchMedia("(pointer:fine)").matches) {
    $$(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(800px) rotateX(${-y * 9}deg) rotateY(${x * 9}deg) translateY(-6px)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ================= CART ================= */
  const CART_KEY = "scoop-cart";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { cart = []; }
  const drawer = $("#cartDrawer"), cartBtn = $("#cartBtn"), cartCount = $("#cartCount");

  const saveCart = () => localStorage.setItem(CART_KEY, JSON.stringify(cart));
  function renderCart() {
    const items = $("#cartItems");
    if (!cart.length) {
      items.innerHTML = `<p class="drawer__empty">Your cone is empty 🍦<br />Add a flavor to get started!</p>`;
    } else {
      items.innerHTML = cart.map((it) => `
        <div class="cart-item">
          <div class="cart-item__info"><b>${it.name}</b><span>${money(it.price)} each</span></div>
          <div class="qty"><button data-dec="${it.id}">−</button><b>${it.qty}</b><button data-inc="${it.id}">+</button></div>
          <button class="cart-item__rm" data-rm="${it.id}" aria-label="Remove">✕</button>
        </div>`).join("");
    }
    const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = Math.round(sub * 5) / 100;
    const del = !cart.length || sub >= 500 ? 0 : 29;
    $("#cartSubtotal").textContent = money(sub);
    $("#cartTax").textContent = money(tax);
    $("#cartDelivery").textContent = del ? money(del) : "FREE";
    $("#cartTotal").textContent = money(sub + tax + del);
    $("#checkoutBtn").disabled = !cart.length;
    const n = cart.reduce((s, i) => s + i.qty, 0);
    cartCount.textContent = n;
    cartCount.classList.toggle("is-on", n > 0);
    saveCart();
  }
  function addToCart(card) {
    const { id, name, price } = card.dataset;
    const ex = cart.find((i) => i.id === id);
    if (ex) ex.qty = Math.min(ex.qty + 1, 50); else cart.push({ id, name, price: +price, qty: 1 });
    renderCart();
    const r = $(".btn-cart", card).getBoundingClientRect();
    burstConfetti(r.left + r.width / 2, r.top, 24);
    showToast(`${name} added to your cone 🍦`);
  }
  $$(".flavor-card").forEach((card) =>
    $(".btn-cart", card).addEventListener("click", () => addToCart(card)));
  $("#cartItems").addEventListener("click", (e) => {
    const inc = e.target.dataset.inc, dec = e.target.dataset.dec, rm = e.target.dataset.rm;
    if (inc) { const it = cart.find((i) => i.id === inc); it.qty = Math.min(it.qty + 1, 50); }
    if (dec) { const it = cart.find((i) => i.id === dec); it.qty--; if (it.qty < 1) cart = cart.filter((i) => i !== it); }
    if (rm) cart = cart.filter((i) => i.id !== rm);
    renderCart();
  });
  cartBtn.addEventListener("click", () => { drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); });
  $("#cartClose").addEventListener("click", () => { drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); });
  renderCart();

  /* ================= CHECKOUT ================= */
  const modal = $("#checkoutModal");
  let lastOrder = null;

  function openCheckout() {
    if (!cart.length) return;
    drawer.classList.remove("is-open");
    showStep("details");
    renderCoTotals();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }
  function closeCheckout() { modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true"); }
  function showStep(step) {
    $("#coStepDetails").hidden = step !== "details";
    $("#coStepPay").hidden = step !== "pay";
    $("#coStepDone").hidden = step !== "done";
  }
  function totalsOf(items) {
    const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = Math.round(sub * 5) / 100;
    const del = sub >= 500 ? 0 : 29;
    return { subtotal: sub, tax, delivery: del, total: Math.round((sub + tax + del) * 100) / 100 };
  }
  function renderCoTotals() {
    const t = totalsOf(cart);
    $("#coTotals").innerHTML = `<div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
      <div><span>Tax (5%)</span><span>${money(t.tax)}</span></div>
      <div><span>Delivery</span><span>${t.delivery ? money(t.delivery) : "FREE"}</span></div>
      <div><span>Total</span><b>${money(t.total)}</b></div>`;
  }
  $("#checkoutBtn").addEventListener("click", openCheckout);
  $("#coClose").addEventListener("click", closeCheckout);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeCheckout(); });
  $("#payBackBtn").addEventListener("click", () => showStep("details"));

  $("#coForm").addEventListener("submit", (e) => {
    e.preventDefault();
    $("#payAmount").textContent = money(totalsOf(cart).total);
    $("#payTotals").innerHTML = $("#coTotals").innerHTML;
    showStep("pay");
    updateQr();
  });

  /* payment method switch */
  const upiDetail = $("#upiDetail"), cardDetail = $("#cardDetail");
  $$('input[name="payMethod"]').forEach((r) =>
    r.addEventListener("change", () => {
      const m = $('input[name="payMethod"]:checked').value;
      upiDetail.hidden = m !== "upi";
      cardDetail.hidden = m !== "card";
      if (m === "upi") updateQr();
    }));

  function updateQr() {
    const t = totalsOf(cart);
    const vpa = ($("#upiVpa").value || "scoopnirvana@upi").trim();
    const url = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=Scoop%20Nirvana&am=${t.total}&cu=INR&tn=${encodeURIComponent("Scoop Nirvana order")}`;
    $("#upiQr").src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
  }
  const UPI_ID = "scoopnirvana@upi";
  $("#upiVpa").addEventListener("change", updateQr);

  $("#payBtn").addEventListener("click", async () => {
    const btn = $("#payBtn");
    const method = $('input[name="payMethod"]:checked').value;
    if (method === "card") {
      const num = $("#cardNum").value.replace(/\s/g, "");
      if (!/^\d{16}$/.test(num)) { showToast("Enter a 16-digit card number (any digits work in demo)"); return; }
    }
    btn.disabled = true; btn.textContent = "Processing…";
    try {
      // 1) create order
      const orderRes = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: $("#coName").value, email: $("#coEmail").value, phone: $("#coPhone").value },
          items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
          notes: $("#coNotes").value,
        }),
      }).then((r) => r.json());
      if (orderRes.error) throw new Error(orderRes.error);

      // 2) pay
      const payRes = await fetch("/api/payments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderRes.order.orderId, method }),
      }).then((r) => r.json());
      if (payRes.error) throw new Error(payRes.error);

      lastOrder = payRes.order;
      const ok = payRes.payment.status === "success";
      const cash = payRes.payment.status === "pending_cash";
      $("#successEmoji").textContent = ok ? "🎉" : cash ? "💵" : "💔";
      $("#successTitle").textContent = ok ? "Order confirmed!" : cash ? "Order placed — pay on delivery" : "Payment failed";
      $("#successBody").innerHTML = ok
        ? `Order <span class="order-ref">${orderRes.order.orderId}</span> is being scooped.<br />Total paid: <b>${money(payRes.payment.amount)}</b> via ${method.toUpperCase()}<br />Receipt: ${payRes.payment.txnRef}`
        : cash
          ? `Order <span class="order-ref">${orderRes.order.orderId}</span> saved.<br />Keep <b>${money(payRes.payment.amount)}</b> ready at the door 🚪`
          : `Your card was declined (simulated). Nothing was charged — try UPI or cash.`;
      showStep("done");
      if (ok) { burstConfetti(innerWidth / 2, innerHeight * .4, 60); goTo(6); }
    } catch (err) {
      showToast(err.message || "Something melted — please retry");
    } finally {
      btn.disabled = false; btn.innerHTML = `Pay now<span class="btn__shine"></span>`;
    }
  });
  $("#doneBtn").addEventListener("click", () => {
    if (lastOrder && lastOrder.status === "paid") { cart = []; renderCart(); }
    closeCheckout();
  });

  /* ================= FEEDBACK ================= */
  const starBtns = $$("#starField .stars button");
  let rating = 0;
  const NOTES = ["", "Meh 🙃", "Okay-ish 🙂", "Pretty sweet 😋", "Loved it 😍", "NIRVANA!! 🤩"];
  function paintStars(n) {
    starBtns.forEach((b, i) => b.classList.toggle("lit", i < n));
    $("#starOut").textContent = n ? `${n} star${n > 1 ? "s" : ""} — ${NOTES[n]}` : "Tap a star";
  }
  starBtns.forEach((b) => b.addEventListener("click", () => { rating = +b.dataset.val; paintStars(rating); }));
  paintStars(0);

  const fbFeed = $("#fbFeed");
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function renderFeed(rows) {
    fbFeed.innerHTML = rows.slice(0, 6).map((f) => `
      <div class="fb-item"><b>${esc(f.name || "Anonymous")}</b> <span class="fb-stars">${"★".repeat(f.rating)}${"☆".repeat(5 - f.rating)}</span>
      <br />${esc(f.message)}<small>${new Date(f.createdAt).toLocaleString()}</small></div>`).join("") ||
      `<p class="drawer__empty">No feedback yet — be the first!</p>`;
  }
  async function loadFeedback() {
    try { renderFeed((await fetch("/api/feedback").then((r) => r.json())).feedback || []); }
    catch { fbFeed.innerHTML = `<p class="drawer__empty">Feedback unavailable offline</p>`; }
  }
  loadFeedback();

  $("#feedbackForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!rating) { showToast("Pick a star rating first ⭐"); return; }
    const btn = $("#fbSubmit");
    btn.disabled = true; btn.textContent = "Sending…";
    try {
      const res = await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: $("#fbName").value, email: $("#fbEmail").value, rating, message: $("#fbMsg").value }),
      }).then((r) => r.json());
      if (res.error) throw new Error(res.error);
      burstConfetti(innerWidth / 2, innerHeight * .5, 40);
      showToast("Thanks! Your feedback is in 💌");
      $("#fbMsg").value = ""; rating = 0; paintStars(0);
      loadFeedback();
    } catch (err) { showToast(err.message || "Could not send feedback"); }
    finally { btn.disabled = false; btn.innerHTML = `Send feedback<span class="btn__shine"></span>`; }
  });

  /* newsletter (slide 6) */
  $("#joinForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = $("#confettiBtn"), r = btn.getBoundingClientRect();
    burstConfetti(r.left + r.width / 2, r.top);
    showToast("You're in! Coupon inbound 💌");
    e.target.reset();
  });

  /* ---------------- quotes carousel ---------------- */
  const quotes = $$(".quote"), qdots = $$("#quotesDots .dot");
  let qi = 0, qTimer = null;
  function showQuote(n) {
    quotes[qi]?.classList.remove("is-active"); qdots[qi]?.classList.remove("is-active");
    qi = (n + quotes.length) % quotes.length;
    quotes[qi].classList.add("is-active"); qdots[qi].classList.add("is-active");
  }
  function startQuotes() { if (!reducedMotion) qTimer = setInterval(() => showQuote(qi + 1), 4500); }
  qdots.forEach((d, n) => d.addEventListener("click", () => { showQuote(n); clearInterval(qTimer); startQuotes(); }));
  startQuotes();

  /* ---------------- gallery lightbox ---------------- */
  const lightbox = $("#lightbox"), lbImg = $("#lightboxImg");
  $$(".gallery__item").forEach((fig) => fig.addEventListener("click", () => {
    const img = $("img", fig);
    lbImg.src = img.src.replace(/w=800/, "w=1600");
    lightbox.classList.add("is-open"); lightbox.setAttribute("aria-hidden", "false");
  }));
  const closeLb = () => { lightbox.classList.remove("is-open"); lightbox.setAttribute("aria-hidden", "true"); };
  $("#lightboxClose").addEventListener("click", closeLb);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLb(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLb(); });

  /* ---------------- theme + to-top ---------------- */
  const themeBtn = $("#themeToggle");
  const setTheme = (t) => {
    document.documentElement.dataset.theme = t;
    themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
    localStorage.setItem("scoop-theme", t);
    window.dispatchEvent(new CustomEvent("theme:changed"));
  };
  setTheme(localStorage.getItem("scoop-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  themeBtn.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  $("#toTop").addEventListener("click", () => goTo(0));
})();
