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

let memoryStore = { bookings: [] };
function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) memoryStore = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    memoryStore = { bookings: [] };
  }
  if (!memoryStore || !Array.isArray(memoryStore.bookings)) memoryStore = { bookings: [] };
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

async function sendBookingConfirmation(b) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email] RESEND_API_KEY not set — confirmation for ${b.email} not sent (ref ${b.id}).`);
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
        to: [b.email],
        subject: `You're booked — ${b.service} on ${longDate(b.date)} at ${b.time}`,
        text: confirmationText(b),
        html: confirmationHtml(b),
        ...(CLINIC_EMAIL ? { reply_to: CLINIC_EMAIL } : {}),
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
    const out = await res.json().catch(() => ({}));
    return { sent: true, id: out.id || null };
  } catch (err) {
    console.warn(`[email] confirmation failed for ${b.email} (ref ${b.id}):`, err.message);
    return { sent: false, reason: "send-failed" };
  }
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

app.get("/api/slots", (req, res) => {
  res.json(SERVICE_TIMES);
});

/* public slot availability only — no customer data */
app.get("/api/availability", (_req, res) => {
  const { bookings } = readData();
  res.json({ bookings: bookings.map((b) => ({ date: b.date, time: b.time, therapist: b.therapist })) });
});

app.get("/api/bookings", requireAdmin, (req, res) => {
  const { bookings } = readData();
  res.json({ bookings });
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
