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

app.post("/api/bookings", (req, res) => {
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

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `Hi APEX Physiotherapy, I'd like to confirm my booking: ${service} on ${date} at ${time} with ${booking.therapist}. Name: ${name}.`
  )}`;

  res.status(201).json({ booking, whatsapp });
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
