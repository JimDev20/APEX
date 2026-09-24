/* APEX Physiotherapy — frontend logic */
"use strict";

const SERVICES = [
  { id: "physio", icon: "🫁", name: "Physiotherapy", desc: "Hands-on assessment and treatment for pain, injury and restriction.", meta: "45–60 min" },
  { id: "return-to-sport", icon: "🏃", name: "Return to Sport", desc: "Structured, load-progressive rehab built to get you back to play — safely.", meta: "60 min" },
  { id: "personal-training", icon: "🏋️", name: "Personal Training", desc: "Individualised strength and conditioning, guided by your clinical baseline.", meta: "60 min" },
  { id: "shockwave", icon: "⚡", name: "Shockwave Therapy", desc: "Focused extracorporeal shockwave for stubborn tendon and soft-tissue pain.", meta: "30 min" },
  { id: "sports-massage", icon: "💆", name: "Sports Massage", desc: "Deep-tissue treatment for tight, overworked muscles and faster recovery.", meta: "45 min" },
  { id: "mobility", icon: "🧘", name: "Mobility & Prevention", desc: "Build the range and resilience to stay ahead of injury, long term.", meta: "60 min" },
];

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

async function loadBookedSlots() {
  try {
    const res = await fetch("/api/bookings");
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
       <p style="margin-top:10px">A confirmation is on its way to <strong>${escapeHtml(b.email)}</strong>.</p>
       <a class="btn btn-primary wa" href="${escapeHtml(data.whatsapp)}" target="_blank" rel="noopener">Confirm on WhatsApp</a>`
    );
    $("#bookingForm").reset();
    $("#bkDate").value = "";
    selectedDate = ""; selectedTime = "";
    msg.className = "form-msg ok";
    msg.textContent = "Booking confirmed — see the confirmation popup.";
    renderCalendar();
    loadBookedSlots();
  } catch (err) {
    fail(err.message);
    loadBookedSlots();
  } finally {
    btn.disabled = false;
    btn.textContent = btn.dataset.label || "Confirm booking";
  }
});

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
    const targets = sec.querySelectorAll(".card, .method, .step, .g-item, .char-card, .stat");
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
const sectionIds = ["team", "therapists", "services", "methods", "journey", "gallery", "testimonials", "booking"];
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
renderGallery();
renderTestimonials();
renderCalendar();
renderSlots();
loadBookedSlots();
initAnimations();
