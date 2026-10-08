/* APEX — self-service manage booking (lookup / reschedule / cancel) */
"use strict";

const $ = (s) => document.querySelector(s);
const LEAD_MS = 30 * 60 * 1000;
const SLOT_TIMES = ["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","17:00","17:30","18:00","18:30","19:00"];
const SERVICE_MINUTES = {
  "Physiotherapy": 60,
  "Return to Sport": 60,
  "Personal Training": 60,
  "Shockwave Therapy": 30,
  "Sports Massage": 45,
  "Mobility & Prevention": 60,
};
const CLINIC_LOCATION = "APEX Physiotherapy, Ironmonger Row, Clerkenwell, London EC1V 3QN";

let creds = { reference: "", email: "" };
let current = null;
let availability = [];
let newDate = "";
let newTime = "";

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

function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function slotIsPast(iso, time) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(iso + "T00:00:00");
  d.setHours(h, m, 0, 0);
  return d.getTime() <= Date.now() + LEAD_MS;
}

function slotTaken(iso, time) {
  if (!current) return true;
  const key = therapistKey(current.therapist);
  return availability.some((b) =>
    b.date === iso && b.time === time &&
    // ignore the booking being moved itself
    !(current.reference && b.date === current.date && b.time === current.time && slotConflicts(therapistKey(b.therapist), key)) &&
    slotConflicts(therapistKey(b.therapist), key)
  );
}

/* ---------- Calendar links (same format as booking flow) ---------- */
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
  const end = new Date(start.getTime() + (SERVICE_MINUTES[b.service] || 60) * 60000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//APEX Physiotherapy//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.reference}@apex-physio`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(b.service + " — APEX Physiotherapy")}`,
    `DESCRIPTION:${icsEscape(`${b.service} with ${b.therapist} at APEX Physiotherapy.`)}`,
    `LOCATION:${icsEscape(CLINIC_LOCATION)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

function googleCalUrl(b) {
  const start = slotStart(b.date, b.time);
  const end = new Date(start.getTime() + (SERVICE_MINUTES[b.service] || 60) * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${b.service} — APEX Physiotherapy`,
    dates: `${icsStamp(start)}/${icsStamp(end)}`,
    details: `Session with ${b.therapist}. Reference ${b.reference}.`,
    location: CLINIC_LOCATION,
  });
  return "https://calendar.google.com/calendar/render?" + params.toString();
}

async function api(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || ("Request failed (HTTP " + res.status + ")"));
  return data;
}

/* ---------- Lookup ---------- */
$("#lookupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#lookupMsg");
  const btn = $("#lookupBtn");
  const reference = $("#mgRef").value.trim();
  const email = $("#mgEmail").value.trim();
  if (!reference || !email) {
    msg.className = "form-msg err";
    msg.textContent = "Enter your booking reference and email.";
    return;
  }
  msg.className = "form-msg";
  msg.textContent = "Looking up…";
  btn.disabled = true;
  try {
    const data = await api("/api/booking/lookup", { reference, email });
    creds = { reference, email };
    current = data.booking;
    newDate = "";
    newTime = "";
    renderResult();
    msg.className = "form-msg ok";
    msg.textContent = "Booking found.";
    await loadAvailability();
  } catch (err) {
    $("#resultCard").hidden = true;
    current = null;
    msg.className = "form-msg err";
    msg.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

function renderResult() {
  if (!current) return;
  $("#resultCard").hidden = false;
  $("#bkTitle").textContent = `${current.service} — ${fmtDate(current.date)} at ${current.time}`;
  $("#bkDetails").innerHTML =
    `Hi <strong>${escapeHtml(current.name)}</strong> — with ${escapeHtml(current.therapist)}.<br>` +
    `Ends ${escapeHtml(current.end || "")} · Reference <code>${escapeHtml(current.reference)}</code>`;

  const blob = new Blob([bookingICS(current)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const icsBtn = $("#icsBtn");
  icsBtn.href = url;
  icsBtn.download = `apex-${current.date}-${current.time.replace(":", "")}.ics`;
  $("#gcalBtn").href = googleCalUrl(current);

  const dateInput = $("#mgDate");
  dateInput.min = todayISO();
  dateInput.value = "";
  $("#rsMsg").className = "form-msg";
  $("#rsMsg").textContent = "";
  $("#cancelMsg").className = "form-msg";
  $("#cancelMsg").textContent = "";
  $("#reschedBtn").disabled = true;
  renderSlots();
}

async function loadAvailability() {
  try {
    const res = await fetch("/api/availability");
    const data = await res.json();
    availability = data.bookings || [];
    renderSlots();
  } catch { /* offline: leave slots enabled, server still validates */ }
}

/* ---------- Reschedule ---------- */
$("#mgDate").addEventListener("change", () => {
  newDate = $("#mgDate").value;
  newTime = "";
  renderSlots();
});

function renderSlots() {
  const grid = $("#rsSlots");
  const label = $("#rsDate");
  if (!newDate) {
    label.textContent = "";
    grid.innerHTML = "<p class='slots-hint'>Pick a date first.</p>";
    $("#reschedBtn").disabled = true;
    return;
  }
  label.textContent = "· " + fmtDate(newDate);
  grid.innerHTML = SLOT_TIMES.map((t) => {
    const taken = slotTaken(newDate, t);
    const past = slotIsPast(newDate, t);
    const isCurrent = current && newDate === current.date && t === current.time;
    const disabled = taken || past || isCurrent;
    const note = isCurrent ? " (current)" : taken ? " (booked)" : past ? " (past)" : "";
    return `<button type="button" class="slot ${t === newTime ? "selected" : ""}" data-t="${t}"` +
      `${disabled ? " disabled" : ""} aria-label="${t}${note}" aria-pressed="${t === newTime}">${t}</button>`;
  }).join("");
  grid.querySelectorAll(".slot:not(:disabled)").forEach((s) =>
    s.addEventListener("click", () => {
      newTime = s.dataset.t;
      renderSlots();
      $("#reschedBtn").disabled = false;
    }));
  $("#reschedBtn").disabled = !newTime;
}

$("#reschedBtn").addEventListener("click", async () => {
  const msg = $("#rsMsg");
  if (!current || !newDate || !newTime) return;
  const btn = $("#reschedBtn");
  msg.className = "form-msg";
  msg.textContent = "Moving…";
  btn.disabled = true;
  try {
    const data = await api("/api/booking/reschedule", {
      reference: creds.reference,
      email: creds.email,
      date: newDate,
      time: newTime,
    });
    current = data.booking;
    renderResult();
    await loadAvailability();
    msg.className = "form-msg ok";
    msg.textContent = `Moved to ${fmtDate(current.date)} at ${current.time}.` +
      (data.email === "sent" ? " Updated confirmation email sent." : "");
  } catch (err) {
    msg.className = "form-msg err";
    msg.textContent = err.message;
    btn.disabled = false;
  }
});

/* ---------- Cancel ---------- */
$("#cancelBtn").addEventListener("click", async () => {
  const msg = $("#cancelMsg");
  if (!current) return;
  if (!confirm(`Cancel ${current.service} on ${fmtDate(current.date)} at ${current.time}?`)) return;
  const btn = $("#cancelBtn");
  msg.className = "form-msg";
  msg.textContent = "Cancelling…";
  btn.disabled = true;
  try {
    await api("/api/booking/cancel", { reference: creds.reference, email: creds.email });
    msg.className = "form-msg ok";
    msg.textContent = "Booking cancelled. A cancellation email is on its way.";
    $("#reschedBtn").disabled = true;
    btn.textContent = "Cancelled";
  } catch (err) {
    msg.className = "form-msg err";
    msg.textContent = err.message;
    btn.disabled = false;
  }
});

/* Deep-link support: /manage.html?ref=bk_xxx&email=a@b.com */
(function initFromQuery() {
  const q = new URLSearchParams(location.search);
  if (q.get("ref")) $("#mgRef").value = q.get("ref");
  if (q.get("email")) $("#mgEmail").value = q.get("email");
})();
