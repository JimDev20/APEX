import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "bookings.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ bookings: [] }, null, 2));
}

const SERVICE_TIMES = [
  { id: "morning", label: "Morning", slots: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] },
  { id: "afternoon", label: "Afternoon", slots: ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30"] },
  { id: "evening", label: "Evening", slots: ["17:00", "17:30", "18:00", "18:30", "19:00"] },
];

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
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

app.listen(PORT, () => {
  console.log(`APEX Physiotherapy running at http://localhost:${PORT}`);
  console.log(`Booking API: http://localhost:${PORT}/api/bookings`);
});
