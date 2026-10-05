import express from "express";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL
  ? path.join(os.tmpdir(), "apex-data")
  : path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "bookings.json");

let memoryStore = { bookings: [], waitlist: [] };
function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) memoryStore = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    memoryStore = { bookings: [], waitlist: [] };
  }
  if (!memoryStore || !Array.isArray(memoryStore.bookings)) memoryStore = { bookings: [], waitlist: [] };
  if (!Array.isArray(memoryStore.waitlist)) memoryStore.waitlist = [];
}
loadStore();

const SERVICE_TIMES = [
  { id: "morning", label: "Morning", slots: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] },
  { id: "afternoon", label: "Afternoon", slots: ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30"] },
  { id: "evening", label: "Evening", slots: ["17:00", "17:30", "18:00", "18:30", "19:00"] },
];

function readData() {
  return JSON.parse(JSON.stringify(memoryStore));
}

function writeData(data) {
  memoryStore = data;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.warn("Persist skipped (read-only filesystem):", err.message);
  }
}

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));
app.get("/admin.html", (_req, res) => res.redirect(302, "/admin"));
app.use(express.static(path.join(__dirname, "public")));

const ALL_SLOTS = new Set(SERVICE_TIMES.flatMap((s) => s.slots));
const LEAD_MS = 30 * 60 * 1000;

/* ---------- Confirmation email (Resend) ---------- */
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const EMAIL_FROM = process.env.EMAIL_FROM || "APEX Physiotherapy <onboarding@resend.dev>";
const CLINIC_EMAIL = process.env.CLINIC_EMAIL || "";
const SITE_URL = (process.env.SITE_URL || "https://apex-physio.vercel.app").replace(/\/+$/, "");

const SERVICE_MINUTES = {
  "Physiotherapy": 60,
  "Return to Sport": 60,
  "Personal Training": 60,
  "Shockwave Therapy": 30,
  "Sports Massage": 45,
  "Mobility & Prevention": 60,
};

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function longDate(iso) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function sessionEnd(b) {
  const [h, m] = b.time.split(":").map(Number);
  const start = new Date(b.date + "T00:00:00");
  start.setHours(h, m, 0, 0);
  return new Date(start.getTime() + (SERVICE_MINUTES[b.service] || 60) * 60000);
}

function hhmm(d) {
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

function whatsappLink(b) {
  return `https://wa.me/?text=${encodeURIComponent(
    `Hi APEX Physiotherapy, I'd like to confirm my booking: ${b.service} on ${b.date} at ${b.time} with ${b.therapist}. Name: ${b.name}.`
  )}`;
}

function confirmationText(b) {
  const end = sessionEnd(b);
  return [
    `Hi ${b.name},`,
    "",
    `You're booked in at APEX Physiotherapy. Here's the details:`,
    "",
    `  Treatment:  ${b.service}`,
    `  When:       ${longDate(b.date)}, ${b.time}–${hhmm(end)}`,
    `  Therapist:  ${b.therapist}`,
    b.phone ? `  Phone:      ${b.phone}` : "",
    b.notes ? `  Notes:      ${b.notes}` : "",
    "",
    `Reference: ${b.id}`,
    "",
    `Need to change something? Reply to this email or message us on WhatsApp:`,
    whatsappLink(b),
    "",
    `See you soon,`,
    `APEX Physiotherapy`,
    SITE_URL,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

function confirmationHtml(b) {
  const end = sessionEnd(b);
  const row = (label, value) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #1f2a24;color:#8fa398;font-size:13px;vertical-align:top;white-space:nowrap">${label}</td>` +
    `<td style="padding:10px 0;border-bottom:1px solid #1f2a24;color:#e8f0eb;font-size:15px">${value}</td></tr>`;
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f2f5f3;font-family:-apple-system,Segoe UI,Inter,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#0b0e0c;border-radius:16px;overflow:hidden;border:1px solid #1f2a24">
    <tr><td style="padding:28px 28px 8px">
      <p style="margin:0;color:#3ddc84;font-size:12px;letter-spacing:2px;font-weight:700">APEX</p>
      <h1 style="margin:8px 0 4px;color:#e8f0eb;font-size:22px;line-height:1.3">You're booked, ${esc(String(b.name).split(" ")[0] || "there")}.</h1>
      <p style="margin:0;color:#8fa398;font-size:14px">Keep this email for your reference.</p>
    </td></tr>
    <tr><td style="padding:20px 28px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row("Treatment", esc(b.service))}
        ${row("Date", esc(longDate(b.date)))}
        ${row("Time", esc(b.time + " – " + hhmm(end)))}
        ${row("Therapist", esc(b.therapist))}
        ${b.phone ? row("Phone", esc(b.phone)) : ""}
        ${b.notes ? row("Notes", esc(b.notes)) : ""}
        ${row("Reference", `<code style="color:#3ddc84">${esc(b.id)}</code>`)}
      </table>
    </td></tr>
    <tr><td style="padding:8px 28px 28px">
      <a href="${esc(whatsappLink(b))}" style="display:inline-block;background:#3ddc84;color:#06230f;font-weight:700;font-size:15px;text-decoration:none;padding:13px 22px;border-radius:10px">Confirm on WhatsApp</a>
      <p style="margin:18px 0 0;color:#8fa398;font-size:13px;line-height:1.6">Need to change your time? Reply to this email or message us and we'll find you another slot.</p>
    </td></tr>
  </table>
</body></html>`;
}

async function sendEmail({ to, subject, text, html, ref }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email] RESEND_API_KEY not set — "${subject}" to ${to} not sent (ref ${ref}).`);
    return { sent: false, reason: "not-configured" };
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject,
        text,
        html,
        ...(CLINIC_EMAIL ? { reply_to: CLINIC_EMAIL } : {}),
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
    const out = await res.json().catch(() => ({}));
    return { sent: true, id: out.id || null };
  } catch (err) {
    console.warn(`[email] send failed to ${to} (ref ${ref}):`, err.message);
    return { sent: false, reason: "send-failed" };
  }
}

function cancellationText(b) {
  return [
    `Hi ${b.name},`,
    "",
    `Your APEX Physiotherapy session has been cancelled. Here's what was cancelled:`,
    "",
    `  Treatment:  ${b.service}`,
    `  Cancelled:  ${longDate(b.date)}, ${b.time}`,
    `  Therapist:  ${b.therapist}`,
    "",
    `Reference: ${b.id}`,
    "",
    `The slot is back on the calendar so someone else can take it. Nothing else to do.`,
    `Want another time? Book again here:`,
    `${SITE_URL}/#booking`,
    "",
    `See you soon,`,
    `APEX Physiotherapy`,
    SITE_URL,
  ].join("\n");
}

function cancellationHtml(b) {
  const row = (label, value) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #1f2a24;color:#8fa398;font-size:13px;vertical-align:top;white-space:nowrap">${label}</td>` +
    `<td style="padding:10px 0;border-bottom:1px solid #1f2a24;color:#e8f0eb;font-size:15px">${value}</td></tr>`;
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f2f5f3;font-family:-apple-system,Segoe UI,Inter,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#0b0e0c;border-radius:16px;overflow:hidden;border:1px solid #1f2a24">
    <tr><td style="padding:28px 28px 8px">
      <p style="margin:0;color:#3ddc84;font-size:12px;letter-spacing:2px;font-weight:700">APEX</p>
      <h1 style="margin:8px 0 4px;color:#e8f0eb;font-size:22px;line-height:1.3">Session cancelled, ${esc(
        String(b.name).split(" ")[0] || "there"
      )}.</h1>
      <p style="margin:0;color:#8fa398;font-size:14px">Your slot is free for someone else to book.</p>
    </td></tr>
    <tr><td style="padding:20px 28px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row("Treatment", esc(b.service))}
        ${row("Cancelled", esc(`${longDate(b.date)}, ${b.time}`))}
        ${row("Therapist", esc(b.therapist))}
        ${row("Reference", `<code style="color:#3ddc84">${esc(b.id)}</code>`)}
      </table>
    </td></tr>
    <tr><td style="padding:8px 28px 28px">
      <a href="${esc(SITE_URL)}/#booking" style="display:inline-block;background:#3ddc84;color:#06230f;font-weight:700;font-size:15px;text-decoration:none;padding:13px 22px;border-radius:10px">Book another session</a>
      <p style="margin:18px 0 0;color:#8fa398;font-size:13px;line-height:1.6">Cancelling inside 24 hours of the session may carry the session fee, as per our policy. Reply to this email if that's the case.</p>
    </td></tr>
  </table>
</body></html>`;
}

function sendCancellationNotice(b) {
  return sendEmail({
    to: b.email,
    subject: `Cancelled — ${b.service} on ${longDate(b.date)} at ${b.time}`,
    text: cancellationText(b),
    html: cancellationHtml(b),
    ref: b.id,
  });
}

function sendBookingConfirmation(b) {
  return sendEmail({
    to: b.email,
    subject: `You're booked — ${b.service} on ${longDate(b.date)} at ${b.time}`,
    text: confirmationText(b),
    html: confirmationHtml(b),
    ref: b.id,
  });
}

function therapistKey(t) {
  const v = String(t || "").trim();
  if (!v || v.toLowerCase() === "any" || v.toLowerCase() === "first available") return "any";
  return v;
}

function slotConflicts(a, b) {
  return a === "any" || b === "any" || a === b;
}

/* ---------- Admin auth ---------- */
const SESSION_COOKIE = "apex_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString("base64url");
const ADMIN_PASSWORD_IS_EPHEMERAL = !process.env.ADMIN_PASSWORD;
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.createHash("sha256").update(`apex:${ADMIN_PASSWORD}`).digest("hex");

const LOGIN_MAX_ATTEMPTS = 8;
const LOGIN_LOCK_MS = 10 * 60 * 1000;
const loginAttempts = new Map();

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip || "unknown";
}

function parseCookies(req) {
  const jar = {};
  for (const part of String(req.headers.cookie || "").split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    jar[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return jar;
}

function signSession(expires) {
  const payload = Buffer.from(JSON.stringify({ exp: expires })).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function validSession(token) {
  if (typeof token !== "string") return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url"));
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return false;
  try {
    return Date.now() < JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).exp;
  } catch {
    return false;
  }
}

function isAdmin(req) {
  return validSession(parseCookies(req)[SESSION_COOKIE]);
}

function issueSession(req, res) {
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${signSession(Date.now() + SESSION_TTL_MS)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(
      SESSION_TTL_MS / 1000
    )}${secure ? "; Secure" : ""}`
  );
}

function expireSession(res) {
  res.append("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.status(401).json({ error: "Admin sign-in required." });
}

function passwordMatches(candidate) {
  const given = crypto.createHash("sha256").update(String(candidate ?? "")).digest();
  const expected = crypto.createHash("sha256").update(ADMIN_PASSWORD).digest();
  return crypto.timingSafeEqual(given, expected);
}

function loginLocked(ip) {
  const rec = loginAttempts.get(ip);
  return !!rec && rec.until > Date.now();
}

function recordLoginFailure(ip) {
  const now = Date.now();
  const prev = loginAttempts.get(ip);
  const rec = prev && now - prev.firstAt < LOGIN_LOCK_MS ? prev : { count: 0, firstAt: now };
  rec.count += 1;
  if (rec.count >= LOGIN_MAX_ATTEMPTS) rec.until = now + LOGIN_LOCK_MS;
  if (loginAttempts.size > 5000) loginAttempts.clear();
  loginAttempts.set(ip, rec);
}

function loginPage(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>APEX — Admin sign in</title>
  <meta name="theme-color" content="#0b0e0c" />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230b0e0c'/%3E%3Ctext x='32' y='44' font-family='sans-serif' font-size='34' font-weight='700' fill='%233ddc84' text-anchor='middle'%3EA%3C/text%3E%3C/svg%3E" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/style.css" />
  <style>
    body { display: grid; place-items: center; min-height: 100vh; padding: 24px; }
    .login-card {
      width: 100%; max-width: 380px; background: var(--panel); border: 1px solid var(--line);
      border-radius: 18px; padding: 34px 30px;
    }
    .login-card h1 { font-size: 1.5rem; margin: 6px 0 4px; }
    .login-card p.sub { color: var(--muted); font-size: 0.92rem; margin: 0 0 24px; }
    .login-card label { display: block; font-size: 0.8rem; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
    .login-card input[type=password] {
      width: 100%; background: var(--bg-soft); border: 1px solid var(--line); color: var(--text);
      border-radius: 10px; padding: 12px 14px; font-family: inherit; font-size: 1rem;
    }
    .login-card button {
      width: 100%; margin-top: 18px; background: var(--accent); color: #06230f; font-weight: 600;
      border: 0; border-radius: 10px; padding: 13px; font-size: 1rem; font-family: inherit; cursor: pointer;
    }
    .login-err {
      background: rgba(255,122,122,0.12); border: 1px solid rgba(255,122,122,0.4); color: #ff9a9a;
      border-radius: 10px; padding: 10px 14px; font-size: 0.88rem; margin: 0 0 18px;
    }
    .back { display: inline-block; margin-top: 20px; color: var(--muted); font-size: 0.88rem; }
  </style>
</head>
<body>
  <main class="login-card">
    <p class="eyebrow" style="text-align:left">APEX</p>
    <h1>Admin sign in</h1>
    <p class="sub">Bookings dashboard — staff only.</p>
    ${error ? `<p class="login-err">${esc(error)}</p>` : ""}
    <form method="post" action="/admin/login">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
      <button type="submit">Sign in</button>
    </form>
    <a class="back" href="/">&larr; Back to site</a>
  </main>
</body>
</html>`;
}

/* ---------- Self-service booking management ---------- */
const LOOKUP_MAX_ATTEMPTS = 12;
const LOOKUP_LOCK_MS = 15 * 60 * 1000;
const lookupAttempts = new Map();
const NO_MATCH_ERROR =
  "We couldn't find a booking with those details. Check the reference and email in your confirmation.";

function lookupLocked(ip) {
  const rec = lookupAttempts.get(ip);
  return !!rec && rec.until > Date.now();
}

function recordLookupFailure(ip) {
  const now = Date.now();
  const prev = lookupAttempts.get(ip);
  const rec = prev && now - prev.firstAt < LOOKUP_LOCK_MS ? prev : { count: 0, firstAt: now };
  rec.count += 1;
  if (rec.count >= LOOKUP_MAX_ATTEMPTS) rec.until = now + LOOKUP_LOCK_MS;
  if (lookupAttempts.size > 5000) lookupAttempts.clear();
  lookupAttempts.set(ip, rec);
}

function sameEmail(a, b) {
  const given = Buffer.from(String(a || "").trim().toLowerCase());
  const expected = Buffer.from(String(b || "").trim().toLowerCase());
  return given.length > 0 && given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/* Reference alone is not enough — both the reference and the email must match. */
function lookupBooking(reference, email) {
  const ref = String(reference || "").trim().slice(0, 64);
  if (!ref || !email) return null;
  const match = readData().bookings.find((b) => b.id === ref);
  return match && sameEmail(match.email, email) ? match : null;
}

/* Only what the owner of the booking needs to see — never contact details back out. */
function publicBooking(b) {
  return {
    reference: b.id,
    name: b.name,
    service: b.service,
    date: b.date,
    time: b.time,
    end: hhmm(sessionEnd(b)),
    therapist: b.therapist,
  };
}

function handleLookup(req, res) {
  const ip = clientIp(req);
  if (lookupLocked(ip)) {
    return res.status(429).json({ error: "Too many attempts. Try again in a few minutes." });
  }
  const { reference, email } = req.body || {};
  const booking = lookupBooking(reference, email);
  if (!booking) {
    recordLookupFailure(ip);
    return res.status(404).json({ error: NO_MATCH_ERROR });
  }
  lookupAttempts.delete(ip);
  res.json({ booking: publicBooking(booking) });
}

app.post("/api/booking/lookup", handleLookup);

app.post("/api/booking/cancel", async (req, res) => {
  const ip = clientIp(req);
  if (lookupLocked(ip)) {
    return res.status(429).json({ error: "Too many attempts. Try again in a few minutes." });
  }
  const { reference, email } = req.body || {};
  const booking = lookupBooking(reference, email);
  if (!booking) {
    recordLookupFailure(ip);
    return res.status(404).json({ error: NO_MATCH_ERROR });
  }

  const data = readData();
  data.bookings = data.bookings.filter((b) => b.id !== booking.id);
  writeData(data);
  lookupAttempts.delete(ip);

  const mailStatus = await sendCancellationNotice(booking);
  console.log(`[booking] ${booking.id} cancelled by customer (${booking.date} ${booking.time}).`);
  res.json({ ok: true, booking: publicBooking(booking), email: mailStatus.sent ? "sent" : mailStatus.reason });
});

app.post("/api/booking/reschedule", async (req, res) => {
  const ip = clientIp(req);
  if (lookupLocked(ip)) {
    return res.status(429).json({ error: "Too many attempts. Try again in a few minutes." });
  }
  const { reference, email, date, time } = req.body || {};
  const booking = lookupBooking(reference, email);
  if (!booking) {
    recordLookupFailure(ip);
    return res.status(404).json({ error: NO_MATCH_ERROR });
  }

  const newDate = String(date || "").trim();
  const newTime = String(time || "").trim();
  if (!newDate || !newTime) {
    return res.status(400).json({ error: "Pick a new date and time for your session." });
  }
  if (!ALL_SLOTS.has(newTime)) {
    return res.status(400).json({ error: "Invalid time slot." });
  }
  if (booking.date === newDate && booking.time === newTime) {
    return res.status(400).json({ error: "You're already booked at that time." });
  }

  const isoDate = new Date(newDate + "T00:00:00");
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (Number.isNaN(isoDate.getTime()) || isoDate < todayStart) {
    return res.status(400).json({ error: "Date must be today or in the future." });
  }

  const slotDate = new Date(newDate + "T" + newTime + ":00");
  if (Number.isNaN(slotDate.getTime()) || slotDate.getTime() <= Date.now() + LEAD_MS) {
    return res.status(400).json({ error: "That time has already passed — please pick a later slot." });
  }

  const data = readData();
  const current = data.bookings.find((b) => b.id === booking.id);
  if (!current) {
    return res.status(404).json({ error: NO_MATCH_ERROR });
  }
  const key = therapistKey(current.therapist);
  const clash = data.bookings.find(
    (b) => b.id !== current.id && b.date === newDate && b.time === newTime && slotConflicts(therapistKey(b.therapist), key)
  );
  if (clash) {
    return res.status(409).json({ error: "That time slot is already booked. Please pick another." });
  }

  const from = `${current.date} ${current.time}`;
  current.date = newDate;
  current.time = newTime;
  writeData(data);
  lookupAttempts.delete(ip);

  const mailStatus = await sendBookingConfirmation(current);
  console.log(`[booking] ${current.id} rescheduled by customer (${from} -> ${newDate} ${newTime}).`);
  res.json({ ok: true, booking: publicBooking(current), email: mailStatus.sent ? "sent" : mailStatus.reason });
});

const START_TIME = Date.now();

/* Health check — no auth, no secrets, no customer data. For uptime monitors/Vercel. */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: Math.floor((Date.now() - START_TIME) / 1000), time: new Date().toISOString() });
});

app.get("/api/slots", (req, res) => {
  res.json(SERVICE_TIMES);
});

/* public slot availability only — no customer data */
app.get("/api/availability", (_req, res) => {
  const { bookings, waitlist } = readData();
  const waitlistCounts = {};
  for (const w of waitlist || []) {
    const k = `${w.date}|${w.time}`;
    waitlistCounts[k] = (waitlistCounts[k] || 0) + 1;
  }
  res.json({
    bookings: bookings.map((b) => ({ date: b.date, time: b.time, therapist: b.therapist })),
    waitlistCounts,
  });
});

app.get("/api/bookings", requireAdmin, (req, res) => {
  const { bookings } = readData();
  res.json({ bookings });
});

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function bookingsCSV(bookings) {
  const header = ["id", "name", "email", "phone", "service", "therapist", "date", "time", "notes", "created"];
  const lines = [header.join(",")];
  for (const b of bookings) {
    lines.push(
      [b.id, b.name, b.email, b.phone, b.service, b.therapist, b.date, b.time, b.notes, b.created]
        .map(csvCell)
        .join(",")
    );
  }
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

app.get("/api/bookings/export", requireAdmin, (req, res) => {
  const { bookings } = readData();
  const sorted = bookings.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.time || "").localeCompare(b.time || ""));
  const day = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="apex-bookings-${day}.csv"`);
  res.send(bookingsCSV(sorted));
});

app.post("/api/bookings", async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim().slice(0, 40);
  const service = String(body.service || "").trim();
  const therapist = String(body.therapist || "").trim();
  const date = String(body.date || "").trim();
  const time = String(body.time || "").trim();
  const notes = String(body.notes || "").trim().slice(0, 1000);

  if (!name || !email || !service || !date || !time) {
    return res.status(400).json({ error: "Missing required fields (name, email, service, date, time)." });
  }
  if (name.length > 120 || email.length > 200) {
    return res.status(400).json({ error: "Name or email is too long." });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }
  if (!ALL_SLOTS.has(time)) {
    return res.status(400).json({ error: "Invalid time slot." });
  }

  const isoDate = new Date(date + "T00:00:00");
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (Number.isNaN(isoDate.getTime()) || isoDate < todayStart) {
    return res.status(400).json({ error: "Date must be today or in the future." });
  }

  const slotDate = new Date(date + "T" + time + ":00");
  if (Number.isNaN(slotDate.getTime()) || slotDate.getTime() <= Date.now() + LEAD_MS) {
    return res.status(400).json({ error: "That time has already passed — please pick a later slot." });
  }

  const key = therapistKey(therapist);
  const data = readData();
  const clash = data.bookings.find(
    (b) => b.date === date && b.time === time && slotConflicts(therapistKey(b.therapist), key)
  );
  if (clash) {
    return res.status(409).json({ error: "That time slot is already booked. Please pick another." });
  }

  const booking = {
    id: "bk_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    email,
    phone,
    service,
    therapist: key === "any" ? "First available" : key,
    date,
    time,
    notes,
    created: new Date().toISOString(),
  };

  data.bookings.push(booking);
  writeData(data);

  const mailStatus = await sendBookingConfirmation(booking);
  const whatsapp = whatsappLink(booking);

  res.status(201).json({ booking, whatsapp, email: mailStatus.sent ? "sent" : mailStatus.reason });
});

/* ---------- Waitlist: join when a slot is full, promote from admin ---------- */
function validateWaitlistInput(body) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim().slice(0, 40);
  const service = String(body.service || "").trim();
  const therapist = String(body.therapist || "").trim();
  const date = String(body.date || "").trim();
  const time = String(body.time || "").trim();
  const notes = String(body.notes || "").trim().slice(0, 1000);

  if (!name || !email || !service || !date || !time) {
    return { error: "Missing required fields (name, email, service, date, time)." };
  }
  if (name.length > 120 || email.length > 200) {
    return { error: "Name or email is too long." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Please provide a valid email address." };
  }
  if (!ALL_SLOTS.has(time)) {
    return { error: "Invalid time slot." };
  }
  const isoDate = new Date(date + "T00:00:00");
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  if (Number.isNaN(isoDate.getTime()) || isoDate < todayStart) {
    return { error: "Date must be today or in the future." };
  }
  const slotDate = new Date(date + "T" + time + ":00");
  if (Number.isNaN(slotDate.getTime()) || slotDate.getTime() <= Date.now() + LEAD_MS) {
    return { error: "That time has already passed — please pick a later slot." };
  }
  return { name, email, phone, service, therapist, date, time, notes };
}

app.post("/api/waitlist", (req, res) => {
  const parsed = validateWaitlistInput(req.body || {});
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { name, email, phone, service, therapist, date, time, notes } = parsed;
  const key = therapistKey(therapist);

  const data = readData();
  const dup = (data.waitlist || []).find(
    (w) => w.date === date && w.time === time && sameEmail(w.email, email)
  );
  if (dup) {
    return res.status(409).json({ error: "You're already on the waitlist for that slot." });
  }

  const entry = {
    id: "wl_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    email,
    phone,
    service,
    therapist: key === "any" ? "First available" : key,
    date,
    time,
    notes,
    created: new Date().toISOString(),
  };
  data.waitlist.push(entry);
  writeData(data);
  const position = data.waitlist.filter((w) => w.date === date && w.time === time).length;
  res.status(201).json({ entry, position });
});

app.get("/api/waitlist", requireAdmin, (_req, res) => {
  const { waitlist } = readData();
  res.json({ waitlist: (waitlist || []).slice() });
});

app.delete("/api/waitlist/:id", requireAdmin, (req, res) => {
  const data = readData();
  const before = (data.waitlist || []).length;
  data.waitlist = (data.waitlist || []).filter((w) => w.id !== req.params.id);
  if (data.waitlist.length === before) {
    return res.status(404).json({ error: "Waitlist entry not found." });
  }
  writeData(data);
  res.json({ ok: true });
});

app.post("/api/waitlist/:id/promote", requireAdmin, async (req, res) => {
  const data = readData();
  const entry = (data.waitlist || []).find((w) => w.id === req.params.id);
  if (!entry) return res.status(404).json({ error: "Waitlist entry not found." });

  const key = therapistKey(entry.therapist);
  const clash = data.bookings.find(
    (b) => b.date === entry.date && b.time === entry.time && slotConflicts(therapistKey(b.therapist), key)
  );
  if (clash) {
    return res.status(409).json({ error: "That time slot is still booked. Free it first." });
  }

  const booking = {
    id: "bk_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: entry.name,
    email: entry.email,
    phone: entry.phone || "",
    service: entry.service,
    therapist: key === "any" ? "First available" : entry.therapist,
    date: entry.date,
    time: entry.time,
    notes: entry.notes || "",
    created: new Date().toISOString(),
  };
  data.bookings.push(booking);
  data.waitlist = data.waitlist.filter((w) => w.id !== entry.id);
  writeData(data);

  const mailStatus = await sendBookingConfirmation(booking);
  res.status(201).json({ booking, email: mailStatus.sent ? "sent" : mailStatus.reason });
});

app.delete("/api/bookings/:id", requireAdmin, (req, res) => {
  const data = readData();
  const before = data.bookings.length;
  data.bookings = data.bookings.filter((b) => b.id !== req.params.id);
  if (data.bookings.length === before) {
    return res.status(404).json({ error: "Booking not found." });
  }
  writeData(data);
  res.json({ ok: true });
});

app.post("/admin/login", (req, res) => {
  const ip = clientIp(req);
  if (loginLocked(ip)) {
    return res.status(429).send(loginPage("Too many attempts. Try again in a few minutes."));
  }
  if (!passwordMatches((req.body || {}).password)) {
    recordLoginFailure(ip);
    return res.status(401).send(loginPage("That password isn't right."));
  }
  loginAttempts.delete(ip);
  issueSession(req, res);
  res.redirect(303, "/admin");
});

app.post("/api/admin/logout", requireAdmin, (_req, res) => {
  expireSession(res);
  res.json({ ok: true });
});

app.get("/admin", (req, res) => {
  if (!isAdmin(req)) return res.send(loginPage(null));
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  app.listen(PORT, () => {
    console.log(`APEX Physiotherapy running at http://localhost:${PORT}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
    if (ADMIN_PASSWORD_IS_EPHEMERAL) {
      console.log(`[admin] ADMIN_PASSWORD not set — generated for this process: ${ADMIN_PASSWORD}`);
    }
  });
}

export default app;
