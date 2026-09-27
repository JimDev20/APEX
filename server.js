import express from "express";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
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

app.use(express.json());
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

app.get("/api/slots", (req, res) => {
  res.json(SERVICE_TIMES);
});

app.get("/api/bookings", (req, res) => {
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

app.delete("/api/bookings/:id", (req, res) => {
  const data = readData();
  const before = data.bookings.length;
  data.bookings = data.bookings.filter((b) => b.id !== req.params.id);
  if (data.bookings.length === before) {
    return res.status(404).json({ error: "Booking not found." });
  }
  writeData(data);
  res.json({ ok: true });
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  app.listen(PORT, () => {
    console.log(`APEX Physiotherapy running at http://localhost:${PORT}`);
    console.log(`Booking API: http://localhost:${PORT}/api/bookings`);
  });
}

export default app;
