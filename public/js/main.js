/* APEX Physiotherapy — frontend logic */
"use strict";

const SERVICES = [
  { id: "physio", icon: "🫁", name: "Physiotherapy", desc: "Hands-on assessment and treatment for pain, injury and restriction.", meta: "45–60 min", dur: 60 },
  { id: "return-to-sport", icon: "🏃", name: "Return to Sport", desc: "Structured, load-progressive rehab built to get you back to play — safely.", meta: "60 min", dur: 60 },
  { id: "personal-training", icon: "🏋️", name: "Personal Training", desc: "Individualised strength and conditioning, guided by your clinical baseline.", meta: "60 min", dur: 60 },
  { id: "shockwave", icon: "⚡", name: "Shockwave Therapy", desc: "Focused extracorporeal shockwave for stubborn tendon and soft-tissue pain.", meta: "30 min", dur: 30 },
  { id: "sports-massage", icon: "💆", name: "Sports Massage", desc: "Deep-tissue treatment for tight, overworked muscles and faster recovery.", meta: "45 min", dur: 45 },
  { id: "mobility", icon: "🧘", name: "Mobility & Prevention", desc: "Build the range and resilience to stay ahead of injury, long term.", meta: "60 min", dur: 60 },
];

const PRICES = {
  physio: { single: 95, five: 425, ten: 790, note: "Hands-on treatment plus a written plan you keep." },
  "return-to-sport": { single: 110, five: 495, ten: 890, popular: true, note: "Includes objective return-to-sport testing at the end." },
  "personal-training": { single: 90, five: 405, ten: 720, note: "Programming built from your clinical baseline, not guesswork." },
  shockwave: { single: 70, five: 315, ten: 560, note: "Most insurers cover this — we handle the paperwork." },
  "sports-massage": { single: 75, five: 340, ten: 600, note: "Add it to a session for £40 if you're already in." },
  mobility: { single: 90, five: 405, ten: 720, note: "Class-based options included in the membership." },
};

const PRICE_MODES = {
  single: { pack: 1, label: "single session" },
  five: { pack: 5, label: "5-session package" },
  ten: { pack: 10, label: "10-session package" },
};

const METHODS = [
  { num: "01", name: "Manual Therapy", desc: "Precise hands-on mobilisation and soft-tissue work to unlock movement from the inside out." },
  { num: "02", name: "Functional Training", desc: "Rehab that looks and feels like your life — not a clinic — so progress actually transfers." },
  { num: "03", name: "Shockwave Therapy", desc: "Targeted acoustic wave treatment for tendon problems that have stopped responding to exercise." },
];

const GALLERY = [
  { title: "ACL return-to-sport", tag: "Ryan Cole", bg: "linear-gradient(135deg,#0f3d22,#0b0e0c)" },
  { title: "Shoulder rehab", tag: "Sophie Chen", bg: "linear-gradient(135deg,#12301f,#0b0e0c)" },
  { title: "Hip mobilisation", tag: "Alex Turner", bg: "linear-gradient(135deg,#0d2e1a,#0b0e0c)" },
  { title: "Posture correction", tag: "Sophie Chen", bg: "linear-gradient(135deg,#143a24,#0b0e0c)" },
  { title: "Plyometrics", tag: "Alex Turner", bg: "linear-gradient(135deg,#10331e,#0b0e0c)" },
  { title: "Functional strength", tag: "Ryan Cole", bg: "linear-gradient(135deg,#1a452b,#0b0e0c)" },
];

const TESTIMONIALS = [
  { stars: 5, quote: "Eight months of knee pain, gone in six weeks. Ryan didn't just treat me — he taught me how to move again.", name: "Marcus D.", tag: "ACL Return to Sport" },
  { stars: 5, quote: "Sophie rebuilt my shoulder from the ground up. I'm back to lifting heavier than before my injury.", name: "Priya S.", tag: "Shoulder Rehab" },
  { stars: 5, quote: "After years of back niggles, the shockwave + mobility plan actually stuck. Best decision I've made all year.", name: "Tom W.", tag: "Mobility & Prevention" },
];

const THERAPISTS = [
  {
    name: "Ryan Cole", role: "Founder · 10 yrs", short: "RC",
    photo: "/images/portrait-1.jpg",
    bio: "Clinical specialist in lower-limb rehab and return-to-sport. Ryan leads on ACL, Achilles and full rehab programming.",
    mob: 92, train: 95, exp: 98,
    sig: ["Lower-limb rehab", "ACL return-to-sport", "Shockwave"],
    color: "linear-gradient(135deg,#3ddc84,#0f3d22)",
  },
  {
    name: "Sophie Chen", role: "Physiotherapist · 6 yrs", short: "SC",
    photo: "/images/portrait-2.jpg",
    bio: "Upper-body and postural specialist. Sophie's sweet spot is shoulders, spines and the desk-bound athlete.",
    mob: 96, train: 84, exp: 88,
    sig: ["Shoulder & spine", "Posture correction", "Manual therapy"],
    color: "linear-gradient(135deg,#2fd3f0,#0d2e3a)",
  },
  {
    name: "Alex Turner", role: "Sports Physio · 7 yrs", short: "AT",
    photo: "/images/portrait-3.jpg",
    bio: "Former academy S&C coach turned physio. Alex bridges strength work and rehab for field and court athletes.",
    mob: 80, train: 97, exp: 90,
    sig: ["Strength & conditioning", "Sports massage", "Plyometrics"],
    color: "linear-gradient(135deg,#f0a02f,#3a230d)",
  },
];

const FAQS = [
  { q: "Do I need a GP referral?", a: "No. You can book directly and come straight to your assessment. If your insurer asks for a referral we'll write one for you on request." },
  { q: "How long does a session last?", a: "Between 30 and 60 minutes depending on the treatment. Shockwave is 30 minutes; physiotherapy, return-to-sport, personal training and mobility are 45–60." },
  { q: "Can I book a same-day appointment?", a: "Often, yes. We hold back slots for urgent bookings and you can book up to 30 minutes before a session starts." },
  { q: "What should I wear and bring?", a: "Wear something you can move in — shorts or leggings are ideal for lower-limb work. Bring any scan reports, referral letters or a list of the exercises you've already tried." },
  { q: "What if I need to cancel?", a: "Cancel or move your appointment free of charge up to 24 hours before. Inside 24 hours we ask for the session fee, because that slot is gone for good." },
  { q: "Do you treat sports injuries?", a: "That's most of what we do — ACL and Achilles rehab, return-to-sport testing, shoulder and hamstring strains, and the niggles that never quite settle." },
  { q: "Is shockwave worth trying?", a: "If you've been chasing a tendon problem with exercise alone for months, it's the treatment that most often breaks the cycle. Your therapist will tell you honestly if it's not the right call." },
];

/* Clinic details — swap these for the real practice info */
const CLINIC = {
  street: "Ironmonger Row, Clerkenwell",
  city: "London EC1V 3QN",
  phone: "+44 20 7946 0321",
  phoneHref: "tel:+442079460321",
  email: "book@apexphysio.co.uk",
  whatsapp: "https://wa.me/447700900123",
};

const CLINIC_LOCATION = `APEX Physiotherapy, ${CLINIC.street}, ${CLINIC.city}`;

function whatsappHref() {
  return CLINIC.whatsapp + "?text=" + encodeURIComponent("Hi APEX Physiotherapy, I'd like to ask about a session.");
}

const HOURS = [
  { day: "Monday", open: "07:00", close: "20:00" },
  { day: "Tuesday", open: "07:00", close: "20:00" },
  { day: "Wednesday", open: "07:00", close: "20:00" },
  { day: "Thursday", open: "07:00", close: "20:00" },
  { day: "Friday", open: "07:00", close: "20:00" },
  { day: "Saturday", open: "08:00", close: "14:00" },
  { day: "Sunday", open: "", close: "" },
];

const ICONS = {
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2.5 6.8 8.4 5.7a2 2 0 0 0 2.2 0l8.4-5.7"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.8-.9L3 20.5l1.6-4.5a8.3 8.3 0 0 1-.9-3.8 8.4 8.4 0 0 1 8.4-8.4 8.4 8.4 0 0 1 8.9 7.7Z"/></svg>',
};

const CONTACT_CARDS = [
  {
    icon: "pin", label: "Clinic", value: `${CLINIC.street}, ${CLINIC.city}`, action: "Get directions",
    href: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${CLINIC.street}, ${CLINIC.city}`),
  },
  { icon: "phone", label: "Phone", value: CLINIC.phone, action: "Call the clinic", href: CLINIC.phoneHref, copy: CLINIC.phone },
  { icon: "mail", label: "Email", value: CLINIC.email, action: "Send an email", href: "mailto:" + CLINIC.email, copy: CLINIC.email },
  { icon: "chat", label: "WhatsApp", value: "Replies within the hour", action: "Message us", href: whatsappHref() },
];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const hasGsap = typeof window.gsap !== "undefined";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const LEAD_MS = 30 * 60 * 1000; /* minimum lead time before a slot */

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function therapistKey(t) {
  const v = String(t || "").trim();
  if (!v || v.toLowerCase() === "any" || v.toLowerCase() === "first available") return "any";
  return v;
}

function slotConflicts(a, b) {
  return a === "any" || b === "any" || a === b;
}

/* ---------- SVG placeholder avatar ---------- */
function svgAvatar(text, colorA, colorB) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${colorA}"/><stop offset="1" stop-color="${colorB}"/>
    </linearGradient></defs>
    <rect width="200" height="200" fill="url(#g)"/>
    <circle cx="100" cy="78" r="40" fill="rgba(255,255,255,0.22)"/>
    <ellipse cx="100" cy="196" rx="58" ry="46" fill="rgba(255,255,255,0.16)"/>
    <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" font-family="Space Grotesk, sans-serif"
      font-size="52" font-weight="700" fill="#06230f">${text}</text>
  </svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function avatarColors(t) {
  const parts = t.color.split("#");
  return ["#" + parts[1].slice(0, 6), "#" + parts[2].slice(0, 6)];
}

/* ---------- Renderers ---------- */
function renderTherapists() {
  const stage = $("#stageCards");
  stage.innerHTML = THERAPISTS.map((t, i) => {
    const [a, b] = avatarColors(t);
    return `
    <button type="button" class="char-card ${i === 0 ? "active" : "inactive"}" data-i="${i}" aria-label="Select ${escapeHtml(t.name)}">
      <img src="${t.photo || svgAvatar(t.short, a, b)}" alt="${escapeHtml(t.name)}" />
      <span class="cc-name">${escapeHtml(t.name)}</span>
    </button>`;
  }).join("");
  $$(".char-card").forEach((c) => c.addEventListener("click", () => selectTherapist(+c.dataset.i)));
  selectTherapist(0, true);
}

function selectTherapist(i, instant = false) {
  const t = THERAPISTS[i];
  $$(".char-card").forEach((c, idx) => {
    c.classList.toggle("active", idx === i);
    c.classList.toggle("inactive", idx !== i);
  });
  $("#stageLabel").textContent = String(i + 1).padStart(2, "0") + " / " + String(THERAPISTS.length).padStart(2, "0");
  $("#cpAvatar").innerHTML = `<img src="${t.photo || svgAvatar(t.short, ...avatarColors(t))}" alt="${escapeHtml(t.name)}" />`;
  $("#cpAvatar").style.background = t.color;
  $("#cpName").textContent = t.name;
  $("#cpRole").textContent = t.role;
  $("#cpBio").textContent = t.bio;
  $("#cpSig").innerHTML = t.sig.map((s) => `<span class="sig-chip">${escapeHtml(s)}</span>`).join("");
  const setBar = (id, val) => { $("#" + id).style.width = val + "%"; };
  if (instant || !hasGsap) {
    setBar("barMob", t.mob);
    setBar("barTrain", t.train);
    setBar("barExp", t.exp);
  } else {
    gsap.to("#barMob", { width: t.mob + "%", duration: 0.7, ease: "power2.out" });
    gsap.to("#barTrain", { width: t.train + "%", duration: 0.7, ease: "power2.out", delay: 0.08 });
    gsap.to("#barExp", { width: t.exp + "%", duration: 0.7, ease: "power2.out", delay: 0.16 });
  }
  renderSlots();
  return t;
}

$("#prevTherapist").addEventListener("click", () => cycle(-1));
$("#nextTherapist").addEventListener("click", () => cycle(1));
$("#cpBook").addEventListener("click", () => {
  const t = $("#stageCards .char-card.active");
  const name = t ? THERAPISTS[+t.dataset.i].name : "";
  $("#bkTherapist").value = name;
  renderSlots();
  document.querySelector("#booking").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
});
function cycle(dir) {
  const activeCard = $("#stageCards .char-card.active");
  if (!activeCard) return;
  const active = +activeCard.dataset.i;
  const next = (active + dir + THERAPISTS.length) % THERAPISTS.length;
  selectTherapist(next);
}

function renderServices() {
  $("#servicesGrid").innerHTML = SERVICES.map((s) => `
    <button type="button" class="card" data-svc="${s.id}">
      <div class="card-icon" aria-hidden="true">${s.icon}</div>
      <h3>${escapeHtml(s.name)}</h3>
      <p>${escapeHtml(s.desc)}</p>
      <div class="card-meta">${escapeHtml(s.meta)}</div>
    </button>`).join("");
  $$("#servicesGrid .card").forEach((c) =>
    c.addEventListener("click", () => {
      const s = SERVICES.find((x) => x.id === c.dataset.svc);
      openModal(
        `<h3>${escapeHtml(s.name)}</h3>
         <p>${escapeHtml(s.desc)}</p>
         <p style="margin-top:10px"><strong>${escapeHtml(s.meta)}</strong> · typically 3–6 sessions to first review.</p>
         <a class="btn btn-primary wa" href="#booking" data-close-modal>Book this treatment</a>`
      );
    })
  );
}

function renderMethods() {
  $("#methodsGrid").innerHTML = METHODS.map((m) => `
    <div class="method">
      <span class="method-num" aria-hidden="true">${m.num}</span>
      <h3>${escapeHtml(m.name)}</h3>
      <p>${escapeHtml(m.desc)}</p>
    </div>`).join("");
}

/* ---------- Pricing ---------- */
let priceMode = "single";

function packTotal(p) {
  return priceMode === "single" ? p.single : priceMode === "five" ? p.five : p.ten;
}

function setPriceNumber(el, value) {
  const from = Number(String(el.textContent).replace(/[^\d]/g, "")) || 0;
  if (from === value || !hasGsap || reduceMotion) {
    el.textContent = value.toLocaleString();
    return;
  }
  gsap.fromTo(el, { innerText: from }, {
    innerText: value, duration: 0.5, ease: "power2.out", snap: { innerText: 1 },
    onUpdate: function () {
      el.textContent = (Math.round(parseFloat(el.textContent) || 0)).toLocaleString();
    },
    onComplete: function () { el.textContent = value.toLocaleString(); },
  });
}

function renderPrices() {
  const { pack, label } = PRICE_MODES[priceMode];
  $$("#priceGrid .price-card").forEach((card) => {
    const svc = SERVICES.find((x) => x.id === card.dataset.svc);
    if (!svc) return;
    const p = PRICES[svc.id];
    const total = packTotal(p);
    const per = Math.round(total / pack);
    card.classList.toggle("pack", pack > 1);
    card.querySelector(".pc-save").textContent = "Save £" + (p.single * pack - total);
    setPriceNumber(card.querySelector(".pc-num"), total);
    card.querySelector(".pc-per").textContent = pack > 1 ? `£${per} a session · ${pack} sessions` : "per session";
  });
  $("#priceStatus").textContent = "Showing " + label + " prices.";
}

function movePricePill() {
  const btn = $("#priceToggle .pt-btn.on");
  const pill = $("#ptSlider");
  if (!btn || !pill) return;
  pill.style.width = btn.offsetWidth + "px";
  pill.style.transform = `translateX(${btn.offsetLeft}px)`;
}

function setPriceMode(mode) {
  if (!PRICE_MODES[mode]) return;
  priceMode = mode;
  $$("#priceToggle .pt-btn").forEach((b) => {
    const on = b.dataset.mode === mode;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
  });
  movePricePill();
  renderPrices();
}

function renderPricing() {
  $("#priceGrid").innerHTML = SERVICES.map((s) => {
    const p = PRICES[s.id];
    return `
    <article class="price-card${p.popular ? " popular" : ""}" data-svc="${escapeHtml(s.id)}">
      ${p.popular ? '<span class="pc-badge">Most booked</span>' : ""}
      <div class="pc-top">
        <h3>${escapeHtml(s.name)}</h3>
        <span class="pc-dur">${escapeHtml(s.meta)}</span>
      </div>
      <p class="pc-price"><span class="pc-cur">&pound;</span><span class="pc-num">${p.single}</span></p>
      <p class="pc-per">per session</p>
      <span class="pc-save"></span>
      <p class="pc-note">${escapeHtml(p.note)}</p>
      <button type="button" class="btn btn-ghost pc-book" data-svc="${escapeHtml(s.id)}">Book this treatment</button>
    </article>`;
  }).join("");

  $$("#priceToggle .pt-btn").forEach((b) => b.addEventListener("click", () => setPriceMode(b.dataset.mode)));
  $$("#priceGrid .pc-book").forEach((btn) => btn.addEventListener("click", () => {
    const svc = SERVICES.find((x) => x.id === btn.dataset.svc);
    if (!svc) return;
    $("#bkService").value = svc.name;
    document.querySelector("#booking").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }));
  $("#joinMembership").addEventListener("click", () => {
    $("#bkNotes").value = "I'd like to join the Recovery membership";
    document.querySelector("#booking").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  setPriceMode("single");
  window.addEventListener("resize", movePricePill);
}

function renderGallery() {
  $("#galleryGrid").innerHTML = GALLERY.map((g) => `
    <div class="g-item" style="background:${g.bg}">
      <div><h3>${escapeHtml(g.title)}</h3><span>${escapeHtml(g.tag)}</span></div>
    </div>`).join("");
}

function renderTestimonials() {
  $("#tTrack").innerHTML = TESTIMONIALS.map((t) => `
    <div class="t-slide">
      <div class="t-stars" aria-label="${t.stars} out of 5 stars">${"★".repeat(t.stars)}</div>
      <p class="t-quote">“${escapeHtml(t.quote)}”</p>
      <p class="t-name">${escapeHtml(t.name)}</p>
      <p class="t-tag">${escapeHtml(t.tag)}</p>
    </div>`).join("");
  $("#tDots").innerHTML = TESTIMONIALS.map((_, i) =>
    `<span class="${i === 0 ? "on" : ""}" data-d="${i}" role="button" tabindex="0" aria-label="Review ${i + 1}"></span>`).join("");
  $$("#tDots span").forEach((d) => {
    d.addEventListener("click", () => goSlide(+d.dataset.d));
    d.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goSlide(+d.dataset.d); } });
  });
  $("#tPrev").addEventListener("click", () => { goSlide(tIndex - 1); restartAuto(); });
  $("#tNext").addEventListener("click", () => { goSlide(tIndex + 1); restartAuto(); });
  startAuto();
}

let tIndex = 0;
let tTimer = null;

function goSlide(i) {
  tIndex = (i + TESTIMONIALS.length) % TESTIMONIALS.length;
  $("#tTrack").style.transform = `translateX(-${tIndex * 100}%)`;
  $$("#tDots span").forEach((d, di) => d.classList.toggle("on", di === tIndex));
}

function startAuto() {
  if (reduceMotion || tTimer) return;
  tTimer = setInterval(() => { if (!document.hidden) goSlide(tIndex + 1); }, 6000);
}
function stopAuto() { if (tTimer) { clearInterval(tTimer); tTimer = null; } }
function restartAuto() { stopAuto(); startAuto(); }

/* ---------- FAQ ---------- */
function renderFaqs() {
  $("#faqList").innerHTML = FAQS.map((f, i) => `
    <div class="faq-item">
      <h3 class="faq-heading">
        <button type="button" class="faq-q" id="faqQ${i}" aria-expanded="false" aria-controls="faqA${i}">
          <span>${escapeHtml(f.q)}</span>
          <i class="faq-icon" aria-hidden="true"></i>
        </button>
      </h3>
      <div class="faq-a" id="faqA${i}" role="region" aria-labelledby="faqQ${i}">
        <div><p>${escapeHtml(f.a)}</p></div>
      </div>
    </div>`).join("");
  $$("#faqList .faq-q").forEach((btn) => btn.addEventListener("click", () => toggleFaq(btn)));
}

function toggleFaq(btn) {
  const item = btn.closest(".faq-item");
  const open = !item.classList.contains("open");
  item.classList.toggle("open", open);
  btn.setAttribute("aria-expanded", String(open));
}

/* ---------- Contact ---------- */
function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
}

function todayIndex() {
  return (new Date().getDay() + 6) % 7; /* Monday-first */
}

function openState() {
  const d = new Date();
  const idx = todayIndex();
  const today = HOURS[idx];
  const mins = d.getHours() * 60 + d.getMinutes();
  if (!today.open) {
    const next = HOURS.slice(idx + 1).concat(HOURS.slice(0, idx)).find((h) => h.open);
    return { open: false, text: "Closed today" + (next ? ` · opens ${next.day} ${next.open}` : "") };
  }
  if (mins < toMinutes(today.open)) return { open: false, text: `Closed now · opens ${today.open}` };
  if (mins >= toMinutes(today.close)) {
    const next = HOURS.slice(idx + 1).concat(HOURS.slice(0, idx + 1)).find((h) => h.open);
    return { open: false, text: "Closed now" + (next ? ` · opens ${next.day} ${next.open}` : "") };
  }
  return { open: true, text: `Open now · until ${today.close}` };
}

function renderOpenStatus() {
  const s = openState();
  const el = $("#openStatus");
  el.className = "c-status " + (s.open ? "open" : "closed");
  el.innerHTML = `<i class="c-dot" aria-hidden="true"></i>${escapeHtml(s.text)}`;
}

function renderHours() {
  const idx = todayIndex();
  $("#hoursList").innerHTML = HOURS.map((h, i) => `
    <li class="${i === idx ? "today" : ""} ${h.open ? "" : "closed"}">
      <span class="h-day">${escapeHtml(h.day)}</span>
      <span>${h.open ? escapeHtml(`${h.open} – ${h.close}`) : "Closed"}</span>
    </li>`).join("");
}

async function copyText(text, btn) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    btn.textContent = "Copied";
    btn.classList.add("done");
  } catch {
    btn.textContent = "Copy failed";
  }
  window.setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1600);
}

function renderContact() {
  $("#contactCards").innerHTML = CONTACT_CARDS.map((c, i) => `
    <div class="c-card">
      <span class="c-icon" aria-hidden="true">${ICONS[c.icon]}</span>
      <div>
        <span class="c-label">${escapeHtml(c.label)}</span>
        <p class="c-value">${escapeHtml(c.value)}</p>
        <a class="c-action" href="${escapeHtml(c.href)}"${c.href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(c.action)}</a>
      </div>
      ${c.copy ? `<button type="button" class="c-copy" data-copy="${i}" aria-label="Copy ${escapeHtml(c.label.toLowerCase())}">Copy</button>` : ""}
    </div>`).join("");
  $$("#contactCards .c-copy").forEach((btn) =>
    btn.addEventListener("click", () => copyText(CONTACT_CARDS[+btn.dataset.copy].copy, btn)));
  $("#waCta").href = whatsappHref();
  renderHours();
  renderOpenStatus();
  window.setInterval(renderOpenStatus, 60000);
}

/* ---------- Booking calendar ---------- */
const now = new Date();
let calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
let selectedDate = "";
let selectedTime = "";
let allBookings = [];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SLOT_TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","17:00","17:30","18:00","18:30","19:00"];

function toISO(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function slotIsPast(iso, time) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(iso + "T00:00:00");
  d.setHours(h, m, 0, 0);
  return d.getTime() <= Date.now() + LEAD_MS;
}

function slotTaken(iso, time, selKey) {
  return allBookings.some((b) =>
    b.date === iso && b.time === time && slotConflicts(therapistKey(b.therapist), selKey)
  );
}

function renderCalendar() {
  $("#calMonth").textContent = MONTHS[calMonth.getMonth()] + " " + calMonth.getFullYear();
  const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const cellCount = Math.ceil((lead + daysInMonth) / 7) * 7;
  let html = "";
  for (let i = 0; i < cellCount; i++) {
    const dayNum = i - lead + 1;
    if (dayNum < 1 || dayNum > daysInMonth) { html += `<button type="button" class="cal-day other" disabled tabindex="-1"></button>`; continue; }
    const date = new Date(calMonth.getFullYear(), calMonth.getMonth(), dayNum);
    const iso = toISO(date);
    const past = date.getTime() < todayStart;
    const selected = iso === selectedDate;
    const isToday = iso === toISO(new Date());
    html += `<button type="button" class="cal-day ${past ? "past" : ""} ${selected ? "selected" : ""} ${isToday ? "today" : ""}"
      data-iso="${iso}" aria-label="${fmtDate(iso)}${past ? " (unavailable)" : ""}${selected ? " (selected)" : ""}" ${past ? "disabled" : ""}>${dayNum}</button>`;
  }
  $("#calGrid").innerHTML = html;
  $$("#calGrid .cal-day:not(:disabled)").forEach((d) =>
    d.addEventListener("click", () => pickDate(d.dataset.iso)));
  $("#calPrev").disabled = calMonth.getFullYear() === now.getFullYear() && calMonth.getMonth() === now.getMonth();
  $("#calNext").disabled = calMonth.getFullYear() === now.getFullYear() + 1;
}

function pickDate(iso) {
  selectedDate = iso;
  selectedTime = "";
  $("#bkDate").value = iso;
  renderCalendar();
  renderSlots();
}

function renderSlots() {
  const wrap = $("#slotsDate");
  const grid = $("#slotsGrid");
  if (!selectedDate) {
    wrap.textContent = "";
    grid.innerHTML = "<p class='slots-hint'>Select a date first.</p>";
    return;
  }
  wrap.textContent = "· " + fmtDate(selectedDate);
  const selKey = therapistKey($("#bkTherapist").value);
  grid.innerHTML = SLOT_TIMES.map((t) => {
    const taken = slotTaken(selectedDate, t, selKey);
    const past = slotIsPast(selectedDate, t);
    const disabled = taken || past;
    const label = taken ? " (booked)" : past ? " (past)" : "";
    return `<button type="button" class="slot ${t === selectedTime ? "selected" : ""}" data-t="${t}"
      ${disabled ? "disabled" : ""} aria-label="${t}${label}" aria-pressed="${t === selectedTime}">${t}</button>`;
  }).join("");
  $$("#slotsGrid .slot:not(:disabled)").forEach((s) =>
    s.addEventListener("click", () => { selectedTime = s.dataset.t; renderSlots(); }));
}

$("#calPrev").addEventListener("click", () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); renderCalendar(); });
$("#calNext").addEventListener("click", () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); renderCalendar(); });
$("#bkTherapist").addEventListener("change", () => { selectedTime = ""; renderSlots(); });

/* ---------- Calendar invite (.ics) ---------- */
function serviceMinutes(name) {
  const s = SERVICES.find((x) => x.name === name);
  return (s && s.dur) || 60;
}

function slotStart(iso, time) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(iso + "T00:00:00");
  d.setHours(h, m, 0, 0);
  return d;
}

function icsStamp(d) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsEscape(s) {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function bookingICS(b) {
  const start = slotStart(b.date, b.time);
  const end = new Date(start.getTime() + serviceMinutes(b.service) * 60000);
  const desc = [
    `${b.service} with ${b.therapist} at APEX Physiotherapy.`,
    b.phone ? `Phone: ${b.phone}` : "",
    b.notes ? `Notes: ${b.notes}` : "",
  ].filter(Boolean).join("\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//APEX Physiotherapy//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.id}@apex-physio`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(b.service + " — APEX Physiotherapy")}`,
    `DESCRIPTION:${icsEscape(desc)}`,
    `LOCATION:${icsEscape(CLINIC_LOCATION)}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape("Your APEX session starts in 1 hour")}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

function downloadICS(b) {
  const blob = new Blob([bookingICS(b)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `apex-${b.date}-${b.time.replace(":", "")}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function googleCalUrl(b) {
  const start = slotStart(b.date, b.time);
  const end = new Date(start.getTime() + serviceMinutes(b.service) * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${b.service} — APEX Physiotherapy`,
    dates: `${icsStamp(start)}/${icsStamp(end)}`,
    details: [`Session with ${b.therapist}.`, b.notes ? `Notes: ${b.notes}` : ""].filter(Boolean).join("\n"),
    location: CLINIC_LOCATION,
  });
  return "https://calendar.google.com/calendar/render?" + params.toString();
}

async function loadBookedSlots() {
  try {
    const res = await fetch("/api/availability");
    const data = await res.json();
    allBookings = data.bookings || [];
    renderSlots();
  } catch { /* offline: allow all */ }
}

/* ---------- Form submit ---------- */
$("#bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#formMsg");
  const btn = $("#bookingForm button[type=submit]");
  const payload = {
    name: $("#bkName").value.trim(),
    email: $("#bkEmail").value.trim(),
    phone: $("#bkPhone").value.trim(),
    service: $("#bkService").value,
    therapist: $("#bkTherapist").value,
    date: selectedDate,
    time: selectedTime,
    notes: $("#bkNotes").value.trim(),
  };
  const fail = (text) => { msg.className = "form-msg err"; msg.textContent = text; };
  if (!payload.name || !payload.email || !payload.service || !payload.date || !payload.time) {
    return fail("Please fill in your name, email, service, and pick a date + time.");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
    return fail("That email address doesn't look right.");
  }
  if (slotIsPast(payload.date, payload.time)) {
    return fail("That time is too soon — please pick a later slot.");
  }
  msg.className = "form-msg";
  msg.textContent = "Booking…";
  btn.disabled = true;
  btn.dataset.label = btn.textContent;
  btn.textContent = "Booking…";
  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Booking failed.");
    const b = data.booking;
    openModal(
      `<h3>You're booked, ${escapeHtml(String(b.name).split(" ")[0] || "there")}. 🎉</h3>
       <p>${escapeHtml(b.service)} · ${escapeHtml(fmtDate(b.date))} at ${escapeHtml(b.time)}<br>with ${escapeHtml(b.therapist)}.</p>
       <p style="margin-top:10px">${
         data.email === "sent"
           ? `Confirmation email sent to <strong>${escapeHtml(b.email)}</strong>.`
           : `Add <strong>${escapeHtml(b.email)}</strong> to your calendar below, or message us on WhatsApp to confirm.`
       }</p>
<div class="modal-actions">
          <a class="btn btn-primary" href="${escapeHtml(data.whatsapp)}" target="_blank" rel="noopener">Confirm on WhatsApp</a>
          <button type="button" class="btn btn-ghost" data-download-ics>Add to calendar</button>
          <a class="btn btn-ghost" href="${escapeHtml(googleCalUrl(b))}" target="_blank" rel="noopener">Google Calendar</a>
        </div>
        <p style="margin-top:16px;font-size:0.85rem">Plans changed? Reply to your confirmation email or message us on WhatsApp and we'll move you.</p>`
    );
    $("#modalBody [data-download-ics]").addEventListener("click", () => downloadICS(b));
    $("#bookingForm").reset();
    $("#bkDate").value = "";
    selectedDate = ""; selectedTime = "";
    msg.className = "form-msg ok";
    msg.textContent = "Booking confirmed — see the confirmation popup.";
    renderCalendar();
    loadBookedSlots();
  } catch (err) {
    const msgText = (err && err.message) || "Booking failed.";
    if (/already booked/i.test(msgText)) {
      msg.className = "form-msg err";
      msg.innerHTML = "";
      msg.append(document.createTextNode(msgText + " "));
      const wlBtn = document.createElement("button");
      wlBtn.type = "button";
      wlBtn.className = "btn btn-ghost";
      wlBtn.textContent = "Join waitlist for this slot";
      wlBtn.addEventListener("click", () => joinWaitlist(payload, wlBtn));
      msg.append(wlBtn);
    } else {
      fail(msgText);
    }
    loadBookedSlots();
  } finally {
    btn.disabled = false;
    btn.textContent = btn.dataset.label || "Confirm booking";
  }
});

async function joinWaitlist(payload, btn) {
  const msg = $("#formMsg");
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Joining…";
  try {
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not join waitlist.");
    msg.className = "form-msg ok";
    msg.textContent = `You're #${data.position} on the waitlist for ${payload.date} at ${payload.time}. We'll email ${payload.email} if it frees up.`;
  } catch (e) {
    msg.className = "form-msg err";
    msg.textContent = e.message;
    btn.disabled = false;
    btn.textContent = label;
  }
}

/* ---------- Modal ---------- */
let lastFocused = null;

function openModal(html) {
  lastFocused = document.activeElement;
  $("#modalBody").innerHTML = html;
  $("#modal").classList.remove("closing");
  $("#modal").hidden = false;
  document.body.style.overflow = "hidden";
  $("#modalClose").focus();
  $$("#modalBody [data-close-modal]").forEach((el) =>
    el.addEventListener("click", closeModal));
}

function closeModal() {
  if ($("#modal").hidden) return;
  const modal = $("#modal");
  modal.classList.add("closing");
  window.setTimeout(() => {
    modal.hidden = true;
    modal.classList.remove("closing");
    document.body.style.overflow = document.body.classList.contains("nav-open") ? "hidden" : "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    lastFocused = null;
  }, 200);
}

$("#modalClose").addEventListener("click", closeModal);
$("#modal").addEventListener("click", (e) => { if (e.target === $("#modal")) closeModal(); });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!$("#modal").hidden) { closeModal(); return; }
    if ($("#nav").classList.contains("open")) setNav(false);
  }
  if (e.key === "Tab" && !$("#modal").hidden) {
    const focusables = [...$("#modal").querySelectorAll("button, a[href], [tabindex]:not([tabindex='-1'])")]
      .filter((el) => el.offsetParent !== null && !el.disabled);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- Animations ---------- */
function initAnimations() {
  if (!hasGsap) {
    $$(".stat-num").forEach((el) => {
      el.textContent = (+el.dataset.count).toLocaleString() + (el.dataset.suffix || "");
    });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  gsap.from(".hero-content > *", { opacity: 0, y: 30, duration: 0.9, stagger: 0.12, ease: "power3.out", delay: 0.2 });

  $$(".section").forEach((sec) => {
    const targets = sec.querySelectorAll(".card, .method, .step, .g-item, .char-card, .stat, .faq-item, .c-card, .price-card");
    if (!targets.length) return;
    gsap.fromTo(targets,
      { opacity: 0, y: 26 }, {
        opacity: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.07,
        scrollTrigger: { trigger: sec, start: "top 82%" },
      });
  });

  gsap.from(".char-panel", { opacity: 0, y: 30, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: "#charPanel", start: "top 85%" } });

  $$(".stat-num").forEach((el) => {
    const end = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: () => {
        gsap.fromTo(el, { innerText: 0 }, {
          innerText: end, duration: 1.6, ease: "power1.out", snap: { innerText: 1 },
          onUpdate: function () {
            const val = Math.round(parseFloat(el.textContent) || 0);
            el.textContent = val.toLocaleString() + suffix;
          },
          onComplete: () => { el.textContent = end.toLocaleString() + suffix; },
        });
      },
    });
  });
}

/* ---------- Nav ---------- */
function setNav(open) {
  $("#nav").classList.toggle("open", open);
  $("#navToggle").setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("nav-open", open);
}

$("#navToggle").addEventListener("click", () => setNav(!$("#nav").classList.contains("open")));
$$("#navLinks a").forEach((a) => a.addEventListener("click", () => setNav(false)));
window.addEventListener("scroll", () => $("#nav").classList.toggle("scrolled", window.scrollY > 40), { passive: true });
window.addEventListener("resize", () => { if (window.innerWidth > 860) setNav(false); });

/* active section highlight */
const sectionIds = ["team", "therapists", "services", "methods", "pricing", "journey", "gallery", "testimonials", "faq", "contact", "booking"];
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      $$("#navLinks a").forEach((a) =>
        a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  sectionIds.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
}

/* pause carousel on hover/focus */
const carousel = $("#tCarousel");
if (carousel) {
  carousel.addEventListener("mouseenter", stopAuto);
  carousel.addEventListener("mouseleave", startAuto);
  carousel.addEventListener("focusin", stopAuto);
  carousel.addEventListener("focusout", startAuto);
}
document.addEventListener("visibilitychange", () => { document.hidden ? stopAuto() : startAuto(); });

/* ---------- Init ---------- */
$("#year").textContent = new Date().getFullYear();
$("#bkService").innerHTML = `<option value="">Select a treatment…</option>` + SERVICES.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("");
$("#bkTherapist").innerHTML = `<option value="">First available</option>` + THERAPISTS.map((t) => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)}</option>`).join("");

renderTherapists();
renderServices();
renderMethods();
renderPricing();
renderGallery();
renderTestimonials();
renderFaqs();
renderContact();
renderCalendar();
renderSlots();
loadBookedSlots();
initAnimations();
