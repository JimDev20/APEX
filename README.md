# APEX Physiotherapy

Performance. Recovery. Movement.

Clinic website and booking system for APEX Physiotherapy. Static frontend, small
Express API, JSON file storage, no database.

Live site: [apex-physio.vercel.app](https://apex-physio.vercel.app)

[![CI](https://github.com/JimDev20/APEX/actions/workflows/ci.yml/badge.svg)](https://github.com/JimDev20/APEX/actions/workflows/ci.yml)

## Stack

- **Runtime** Node.js, ESM (`"type": "module"`)
- **Server** Express 4
- **Frontend** Vanilla HTML, CSS and JS, no build step or framework
- **Storage** `data/bookings.json`
- **Email** Resend API, with `.ics` and Google Calendar links in confirmations
- **Hosting** Vercel (serverless) or any Node host

## Getting started

```bash
npm install
npm run dev     # node --watch server.js
```

Or without file watching:

```bash
npm start
```

Then open [http://localhost:3000](http://localhost:3000). The admin panel is at
[/admin](http://localhost:3000/admin).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | for admin panel | Password for `/admin` login |
| `SESSION_SECRET` | for admin panel | Signing secret for the admin session cookie |
| `PORT` | no | Server port, defaults to `3000` |
| `RESEND_API_KEY` | for email | Resend key used to send confirmations |
| `EMAIL_FROM` | no | Sender address, defaults to the Resend onboarding address |
| `CLINIC_EMAIL` | no | Reply-to address for confirmation emails |
| `SITE_URL` | no | Public base URL used to build calendar links |
| `VERCEL` | auto | Set by Vercel; switches storage to a temp directory |

Confirmations are skipped if `RESEND_API_KEY` is absent, so the booking flow
works in local development without any keys.

## API

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/slots` | no | Service times and bookable slots |
| `GET` | `/api/availability` | no | Booked slots for a given date |
| `POST` | `/api/bookings` | no | Create a booking, sends confirmation |
| `POST` | `/api/booking/lookup` | no | Find your booking with reference + email |
| `POST` | `/api/booking/cancel` | no | Cancel your booking, sends cancellation email |
| `GET` | `/api/bookings` | admin | List all bookings |
| `GET` | `/api/bookings/export` | admin | Download all bookings as CSV |
| `DELETE` | `/api/bookings/:id` | admin | Delete a booking |
| `POST` | `/admin/login` | no | Exchange password for a session cookie |
| `POST` | `/api/admin/logout` | admin | Clear the session |

Self-service lookup and cancellation require both the booking reference and the
email address the booking was made with. Failures are rate limited per IP and
return the same message either way, so a reference can't be probed for validity.
These endpoints are intentionally not linked anywhere in the public site — the
booking reference lives only in the confirmation email, and changes go through
staff (admin panel, email or WhatsApp). The admin panel itself (`/admin`) is
also not linked from the public navigation or footer.

## Services

| Service | Duration |
| --- | --- |
| Physiotherapy | 60 min |
| Return to Sport | 60 min |
| Personal Training | 60 min |
| Shockwave Therapy | 30 min |
| Sports Massage | 45 min |
| Mobility & Prevention | 60 min |

## Project layout

```
server.js            Express app, API routes, email, persistence
public/
  index.html         Marketing site and booking flow
  admin.html         Admin panel
  css/style.css
  js/main.js         Services, pricing, FAQ, booking logic
  js/admin.js        Admin login and booking management
  images/            Therapist portraits
data/bookings.json   Bookings store (gitignored)
```

## Notes

Bookings are held in memory and flushed to `data/bookings.json` on change. On
Vercel the filesystem is read-only, so state goes to the OS temp directory and
is not durable across invocations. The write path warns and continues rather
than failing the request.

## Licence

MIT
