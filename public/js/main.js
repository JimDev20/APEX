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
    bio: "Clinical specialist in lower-limb rehab and return-to-sport. Ryan leads on ACL, Achilles and full rehab programming.",
    mob: 92, train: 95, exp: 98,
    sig: ["Lower-limb rehab", "ACL return-to-sport", "Shockwave"],
    color: "linear-gradient(135deg,#3ddc84,#0f3d22)",
  },
  {
    name: "Sophie Chen", role: "Physiotherapist · 6 yrs", short: "SC",
    bio: "Upper-body and postural specialist. Sophie's sweet spot is shoulders, spines and the desk-bound athlete.",
    mob: 96, train: 84, exp: 88,
    sig: ["Shoulder & spine", "Posture correction", "Manual therapy"],
    color: "linear-gradient(135deg,#2fd3f0,#0d2e3a)",
  },
  {
    name: "Alex Turner", role: "Sports Physio · 7 yrs", short: "AT",
    bio: "Former academy S&C coach turned physio. Alex bridges strength work and rehab for field and court athletes.",
    mob: 80, train: 97, exp: 90,
    sig: ["Strength & conditioning", "Sports massage", "Plyometrics"],
    color: "linear-gradient(135deg,#f0a02f,#3a230d)",
  },
];

const THEME = {
  "Ryan Cole": "linear-gradient(135deg,#3ddc84,#0f3d22)",
  "Sophie Chen": "linear-gradient(135deg,#2fd3f0,#0d2e3a)",
  "Alex Turner": "linear-gradient(135deg,#f0a02f,#3a230d)",
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

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

/* ---------- Renderers ---------- */
function renderTherapists() {
  const stage = $("#stageCards");
  stage.innerHTML = THERAPISTS.map((t, i) => `
    <button class="char-card ${i === 0 ? "active" : "inactive"}" data-i="${i}">
      <img src="${svgAvatar(t.short, t.color.split("#")[1].slice(0, 6), t.color.split("#")[2].slice(0, 6))}" alt="${t.name}" />
      <span class="cc-name">${t.name}</span>
    </button>`).join("");
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
  $("#cpAvatar").textContent = t.short;
  $("#cpAvatar").style.background = t.color;
  $("#cpName").textContent = t.name;
  $("#cpRole").textContent = t.role;
  $("#cpBio").textContent = t.bio;
  $("#cpSig").innerHTML = t.sig.map((s) => `<span class="sig-chip">${s}</span>`).join("");
  if (instant) {
    $("#barMob").style.width = t.mob + "%";
    $("#barTrain").style.width = t.train + "%";
    $("#barExp").style.width = t.exp + "%";
  } else {
    gsap.to("#barMob", { width: t.mob + "%", duration: 0.7, ease: "power2.out" });
    gsap.to("#barTrain", { width: t.train + "%", duration: 0.7, ease: "power2.out", delay: 0.08 });
    gsap.to("#barExp", { width: t.exp + "%", duration: 0.7, ease: "power2.out", delay: 0.16 });
  }
  return t;
}

$("#prevTherapist").addEventListener("click", () => cycle(-1));
$("#nextTherapist").addEventListener("click", () => cycle(1));
$("#cpBook").addEventListener("click", () => {
  const t = $("#stageCards .char-card.active");
  const name = t ? THERAPISTS[+t.dataset.i].name : "";
  $("#bkTherapist").value = name;
  document.querySelector("#booking").scrollIntoView({ behavior: "smooth" });
});
function cycle(dir) {
  const active = +$("#stageCards .char-card.active").dataset.i;
  const next = (active + dir + THERAPISTS.length) % THERAPISTS.length;
  selectTherapist(next);
}

function renderServices() {
  $("#servicesGrid").innerHTML = SERVICES.map((s) => `
    <button class="card" data-svc="${s.id}">
      <div class="card-icon">${s.icon}</div>
      <h3>${s.name}</h3>
      <p>${s.desc}</p>
      <div class="card-meta">${s.meta}</div>
    </button>`).join("");
  $$("#servicesGrid .card").forEach((c) =>
    c.addEventListener("click", () => openModal(
      `<h3>${SERVICES.find((s) => s.id === c.dataset.svc).name}</h3>
       <p>${SERVICES.find((s) => s.id === c.dataset.svc).desc}</p>
       <p style="margin-top:10px"><strong>${SERVICES.find((s) => s.id === c.dataset.svc).meta}</strong> · typically 3–6 sessions to first review.</p>`
    ))
  );
}

function renderMethods() {
  $("#methodsGrid").innerHTML = METHODS.map((m) => `
    <div class="method">
      <span class="method-num">${m.num}</span>
      <h3>${m.name}</h3>
      <p>${m.desc}</p>
    </div>`).join("");
}

function renderGallery() {
  $("#galleryGrid").innerHTML = GALLERY.map((g) => `
    <div class="g-item" style="background:${g.bg}">
      <div><h3>${g.title}</h3><span>${g.tag}</span></div>
    </div>`).join("");
}

function renderTestimonials() {
  $("#tTrack").innerHTML = TESTIMONIALS.map((t) => `
    <div class="t-slide">
      <div class="t-stars">${"★".repeat(t.stars)}</div>
      <p class="t-quote">“${t.quote}”</p>
      <p class="t-name">${t.name}</p>
      <p class="t-tag">${t.tag}</p>
    </div>`).join("");
  $("#tDots").innerHTML = TESTIMONIALS.map((_, i) => `<span class="${i === 0 ? "on" : ""}" data-d="${i}"></span>`).join("");
  $$("#tDots span").forEach((d) => d.addEventListener("click", () => goSlide(+d.dataset.d)));
  $("#tPrev").addEventListener("click", () => goSlide(tIndex - 1));
  $("#tNext").addEventListener("click", () => goSlide(tIndex + 1));
}
let tIndex = 0;
function goSlide(i) {
  tIndex = (i + TESTIMONIALS.length) % TESTIMONIALS.length;
  gsap.to("#tTrack", { x: -tIndex * 100 + "%", duration: 0.55, ease: "power2.out" });
  $$("#tDots span").forEach((d, di) => d.classList.toggle("on", di === tIndex));
}

/* ---------- Booking calendar ---------- */
const now = new Date();
let calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
let selectedDate = "";
let selectedTime = "";
let bookedSlots = {};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SLOT_TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","17:00","17:30","18:00","18:30","19:00"];

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
    if (dayNum < 1 || dayNum > daysInMonth) { html += `<button type="button" class="cal-day other" disabled></button>`; continue; }
    const date = new Date(calMonth.getFullYear(), calMonth.getMonth(), dayNum);
    const iso = toISO(date);
    const past = date.getTime() < todayStart;
    const selected = iso === selectedDate;
    html += `<button type="button" class="cal-day ${past ? "past" : ""} ${selected ? "selected" : ""}"
      data-iso="${iso}" ${past ? "disabled" : ""}>${dayNum}</button>`;
  }
  $("#calGrid").innerHTML = html;
  $$("#calGrid .cal-day:not(:disabled)").forEach((d) =>
    d.addEventListener("click", () => pickDate(d.dataset.iso)));
  $("#calPrev").disabled = calMonth.getFullYear() === now.getFullYear() && calMonth.getMonth() === now.getMonth();
  $("#calNext").disabled = calMonth.getFullYear() === now.getFullYear() + 1;
}

function toISO(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
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
  if (!selectedDate) { wrap.textContent = ""; $("#slotsGrid").innerHTML = "<p style='grid-column:1/-1;color:var(--muted);font-size:0.85rem'>Select a date first.</p>"; return; }
  wrap.textContent = selectedDate;
  const taken = bookedSlots[selectedDate] || [];
  $("#slotsGrid").innerHTML = SLOT_TIMES.map((t) => `
    <button type="button" class="slot ${t === selectedTime ? "selected" : ""}" data-t="${t}" ${taken.includes(t) ? "disabled" : ""}>${t}</button>`).join("");
  $$("#slotsGrid .slot:not(:disabled)").forEach((s) =>
    s.addEventListener("click", () => { selectedTime = s.dataset.t; renderSlots(); }));
}

$("#calPrev").addEventListener("click", () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); renderCalendar(); });
$("#calNext").addEventListener("click", () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); renderCalendar(); });

async function loadBookedSlots() {
  try {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    bookedSlots = {};
    (data.bookings || []).forEach((b) => {
      bookedSlots[b.date] = bookedSlots[b.date] || [];
      bookedSlots[b.date].push(b.time);
    });
    renderSlots();
  } catch { /* offline: allow all */ }
}

/* ---------- Form submit ---------- */
$("#bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#formMsg");
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
  if (!payload.name || !payload.email || !payload.service || !payload.date || !payload.time) {
    msg.className = "form-msg err";
    msg.textContent = "Please fill in your name, email, service, and pick a date + time.";
    return;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
    msg.className = "form-msg err";
    msg.textContent = "That email address doesn't look right.";
    return;
  }
  msg.className = "form-msg";
  msg.textContent = "Booking…";
  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Booking failed.");
    openModal(
      `<h3>You're booked, ${data.booking.name.split(" ")[0]}. 🎉</h3>
       <p>${data.booking.service} · ${data.booking.date} at ${data.booking.time}<br>with ${data.booking.therapist}.</p>
       <p style="margin-top:10px">A confirmation is on its way to ${data.booking.email}.</p>
       <a class="btn btn-primary wa" href="${data.whatsapp}" target="_blank" rel="noopener">Confirm on WhatsApp</a>`
    );
    $("#bookingForm").reset();
    $("#bkDate").value = "";
    selectedDate = ""; selectedTime = "";
    renderCalendar();
    loadBookedSlots();
  } catch (err) {
    msg.className = "form-msg err";
    msg.textContent = err.message;
  }
});

/* ---------- Modal ---------- */
function openModal(html) {
  $("#modalBody").innerHTML = html;
  $("#modal").hidden = false;
  document.body.style.overflow = "hidden";
}
$("#modalClose").addEventListener("click", closeModal);
$("#modal").addEventListener("click", (e) => { if (e.target === $("#modal")) closeModal(); });
function closeModal() { $("#modal").hidden = true; document.body.style.overflow = ""; }

/* ---------- Animations ---------- */
function initAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  gsap.from(".hero-content > *", { opacity: 0, y: 30, duration: 0.9, stagger: 0.12, ease: "power3.out", delay: 0.2 });

  $$(".section").forEach((sec) => {
    gsap.fromTo(sec.querySelectorAll(".card, .method, .step, .g-item, .char-card, .stat"),
      { opacity: 0, y: 26 }, {
        opacity: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.07,
        scrollTrigger: { trigger: sec, start: "top 82%" },
      });
  });

  gsap.from(".char-panel", { opacity: 0, y: 30, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: "#charPanel", start: "top 85%" } });

  /* stats counters */
  $$(".stat-num").forEach((el) => {
    const end = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: () => {
        gsap.fromTo(el, { innerText: 0 }, {
          innerText: end, duration: 1.6, ease: "power1.out", snap: { innerText: 1 },
          onUpdate: function () {
            const val = Math.round(el.textContent);
            el.textContent = val.toLocaleString() + suffix;
          },
        });
      },
    });
  });
}

/* ---------- Nav ---------- */
$("#navToggle").addEventListener("click", () => $("#nav").classList.toggle("open"));
$$("#navLinks a").forEach((a) => a.addEventListener("click", () => $("#nav").classList.remove("open")));
window.addEventListener("scroll", () => $("#nav").classList.toggle("scrolled", window.scrollY > 40));

/* ---------- Init ---------- */
$("#year").textContent = new Date().getFullYear();
$("#bkService").innerHTML = `<option value="">Select a treatment…</option>` + SERVICES.map((s) => `<option value="${s.name}">${s.name}</option>`).join("");
$("#bkTherapist").innerHTML = `<option value="">First available</option>` + THERAPISTS.map((t) => `<option value="${t.name}">${t.name}</option>`).join("");

renderTherapists();
renderServices();
renderMethods();
renderGallery();
renderTestimonials();
renderCalendar();
loadBookedSlots();
initAnimations();
