#!/usr/bin/env node
/* ============================================================
   SCOOP NIRVANA — backend
   Pure Node.js (no dependencies): static file server + JSON API
   Storage: JSON files in ./data (auto-created & seeded)
   Run:  node server.js   →  http://localhost:5175
   ============================================================ */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 5175;
const ROOT = __dirname;
const DATA = path.join(ROOT, "data");

/* ---------------- tiny JSON-file store ---------------- */
const FILES = ["customers", "orders", "payments", "feedback"];
fs.mkdirSync(DATA, { recursive: true });
for (const f of FILES) {
  const p = path.join(DATA, `${f}.json`);
  if (!fs.existsSync(p)) fs.writeFileSync(p, "[]");
}
const db = {
  read(name) {
    try { return JSON.parse(fs.readFileSync(path.join(DATA, `${name}.json`), "utf8")); }
    catch { return []; }
  },
  write(name, rows) {
    fs.writeFileSync(path.join(DATA, `${name}.json`), JSON.stringify(rows, null, 2));
  },
};
const id = (prefix) => `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
const nowIso = () => new Date().toISOString();

/* ---------------- business logic ---------------- */
const TAX_RATE = 0.05;          // 5% dessert tax :)
const DELIVERY_FEE = 29;        // INR, free above 500
const FREE_DELIVERY_ABOVE = 500;
const UPI_ID = "scoopnirvana@upi"; // demo merchant VPA

function computeTotals(items) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const delivery = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  return { subtotal, tax, delivery, total: Math.round((subtotal + tax + delivery) * 100) / 100 };
}

function upsertCustomer({ name, email, phone }) {
  const customers = db.read("customers");
  email = String(email || "").trim().toLowerCase();
  if (!email) return { error: "Email is required" };
  let customer = customers.find((c) => c.email === email);
  if (customer) {
    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    customer.updatedAt = nowIso();
  } else {
    customer = { customerId: id("CUS"), name: name || "Guest", email, phone: phone || "", createdAt: nowIso(), updatedAt: nowIso() };
    customers.push(customer);
  }
  db.write("customers", customers);
  return { customer };
}

function createOrder(body) {
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return { error: "Cart is empty" };
  for (const it of items) {
    if (!it.name || !Number.isFinite(+it.price) || +it.price <= 0 ||
        !Number.isInteger(+it.qty) || +it.qty <= 0 || +it.qty > 50) {
      return { error: "Invalid cart item" };
    }
  }
  const clean = items.map((i) => ({ id: String(i.id || i.name).slice(0, 60), name: String(i.name).slice(0, 80), price: +i.price, qty: +i.qty }));
  const cust = upsertCustomer(body.customer || {});
  if (cust.error) return cust;

  const orders = db.read("orders");
  const totals = computeTotals(clean);
  const order = {
    orderId: id("ORD"),
    customerId: cust.customer.customerId,
    customerName: cust.customer.name,
    email: cust.customer.email,
    phone: cust.customer.phone,
    items: clean,
    totals,
    notes: String(body.notes || "").slice(0, 300),
    status: "pending_payment",
    createdAt: nowIso(),
  };
  orders.push(order);
  db.write("orders", orders);
  return { order };
}

function createPayment(body) {
  const orders = db.read("orders");
  const order = orders.find((o) => o.orderId === body.orderId);
  if (!order) return { error: "Order not found" };
  if (order.status === "paid") return { error: "Order already paid", order };
  const method = ["upi", "card", "cash"].includes(body.method) ? body.method : "upi";
  const outcome = body.simulate === "decline" ? "failed" : "success"; // demo gateway

  const payments = db.read("payments");
  const payment = {
    paymentId: id("PAY"),
    orderId: order.orderId,
    amount: order.totals.total,
    method,
    txnRef: method === "cash" ? null : id("TXN"),
    status: method === "cash" ? "pending_cash" : outcome,
    createdAt: nowIso(),
  };
  payments.push(payment);
  db.write("payments", payments);

  order.status = payment.status === "success" ? "paid" : payment.status === "pending_cash" ? "pay_on_delivery" : "payment_failed";
  order.paymentId = payment.paymentId;
  db.write("orders", orders);
  return { payment, order };
}

function createFeedback(body) {
  const rating = Math.round(+body.rating);
  if (!body.message || String(body.message).trim().length < 3) return { error: "Message is required" };
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return { error: "Rating must be 1-5" };
  const feedback = db.read("feedback");
  const row = {
    feedbackId: id("FDB"),
    name: String(body.name || "Anonymous").slice(0, 60),
    email: String(body.email || "").slice(0, 80),
    rating,
    message: String(body.message).slice(0, 600),
    createdAt: nowIso(),
  };
  feedback.push(row);
  db.write("feedback", feedback);
  return { feedback: row };
}

function adminStats() {
  const [orders, payments, feedback] = ["orders", "payments", "feedback"].map((n) => db.read(n));
  const paid = orders.filter((o) => o.status === "paid");
  const revenue = paid.reduce((s, o) => s + o.totals.total, 0);
  const avgRating = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length) : 0;
  return {
    orders: orders.length, paid: paid.length, revenue, feedback: feedback.length,
    avgRating: Math.round(avgRating * 10) / 10,
  };
}

/* ---------------- API routing ---------------- */
const api = {
  "POST /api/customers": (b) => upsertCustomer(b.customer || b),
  "POST /api/orders": createOrder,
  "POST /api/payments": createPayment,
  "POST /api/feedback": createFeedback,
  "GET /api/orders": (b, q) => {
    const orders = db.read("orders");
    return { orders: q.email ? orders.filter((o) => o.email === q.email.toLowerCase()) : orders };
  },
  "GET /api/payments": () => ({ payments: db.read("payments") }),
  "GET /api/feedback": () => ({ feedback: db.read("feedback") }),
  "GET /api/admin/stats": adminStats,
  "GET /api/health": () => ({ ok: true, time: nowIso() }),
};

/* ---------------- static files ---------------- */
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon",
};
function serveStatic(req, res, pathname) {
  let rel = pathname === "/" ? "/index.html" : pathname;
  if (rel === "/admin") rel = "/admin.html";
  const full = path.normalize(path.join(ROOT, rel));
  if (!full.startsWith(ROOT)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(full, (err, buf) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(full)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(buf);
  });
}

/* ---------------- server ---------------- */
const server = http.createServer((req, res) => {
  const u = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(u.pathname);
  const query = Object.fromEntries(u.searchParams);
  const key = `${req.method} ${pathname}`;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  if (api[key]) {
    let raw = "";
    req.on("data", (c) => { raw += c; if (raw.length > 1e6) req.destroy(); });
    req.on("end", () => {
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch { res.writeHead(400, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ error: "Bad JSON" })); }
      try {
        const out = api[key](body, query);
        if (out && out.error) { res.writeHead(422, { "Content-Type": "application/json" }); return res.end(JSON.stringify(out)); }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(out));
        console.log(`[${nowIso()}] ${key} → ok`);
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server error" }));
        console.error(key, e);
      }
    });
    return;
  }
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`\n🍦 Scoop Nirvana server running →  http://localhost:${PORT}`);
  console.log(`   Storefront:  http://localhost:${PORT}/`);
  console.log(`   Admin:       http://localhost:${PORT}/admin\n`);
});
