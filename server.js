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

app.get("/api/slots", (req, res) => {
  res.json(SERVICE_TIMES);
});

app.get("/api/bookings", (req, res) => {
  const { bookings } = readData();
  res.json({ bookings });
});

app.post("/api/bookings", (req, res) => {
  const { name, email, phone, service, therapist, date, time, notes } = req.body || {};

  if (!name || !email || !service || !date || !time) {
    return res.status(400).json({ error: "Missing required fields (name, email, service, date, time)." });
  }

  const isoDate = new Date(date + "T00:00:00");
  if (Number.isNaN(isoDate.getTime()) || isoDate < new Date(new Date().toDateString())) {
    return res.status(400).json({ error: "Date must be today or in the future." });
  }

  const data = readData();
  const clash = data.bookings.find((b) => b.date === date && b.time === time && b.therapist === (therapist || "any"));
  if (clash) {
    return res.status(409).json({ error: "That time slot is already booked. Please pick another." });
  }

  const booking = {
    id: "bk_" + Date.now().toString(36),
    name,
    email,
    phone: phone || "",
    service,
    therapist: therapist || "First available",
    date,
    time,
    notes: notes || "",
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
