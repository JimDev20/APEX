/* APEX — admin bookings view */
"use strict";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let all = [];

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function load() {
  try {
    const res = await fetch("/api/bookings");
    if (res.status === 401) { location.replace("/admin"); return; }
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    all = (data.bookings || []).slice()
      .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.time || "").localeCompare(a.time || ""));
    populateFilters();
    render();
  } catch {
    $("#list").innerHTML = `<p class="empty">Could not reach the API. Is the server running?</p>`;
    $("#empty").hidden = true;
  }
}

function populateFilters() {
  const sel = $("#fService");
  const prev = sel.value;
  const svcs = [...new Set(all.map((b) => b.service).filter(Boolean))].sort();
  sel.innerHTML = `<option value="">All services</option>` +
    svcs.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  if (svcs.includes(prev)) sel.value = prev;

  const tSel = $("#fTherapist");
  if (tSel) {
    const tPrev = tSel.value;
    const therapists = [...new Set(all.map((b) => b.therapist).filter(Boolean))].sort();
    tSel.innerHTML = `<option value="">All therapists</option>` +
      therapists.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
    if (therapists.includes(tPrev)) tSel.value = tPrev;
  }
}

function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/* today / upcoming / past relative to local calendar day */
function bookingStatus(b) {
  const today = todayISO();
  if ((b.date || "") < today) return "past";
  if ((b.date || "") > today) return "upcoming";
  return "today";
}

function renderStats() {
  let today = 0, upcoming = 0, past = 0;
  for (const b of all) {
    const s = bookingStatus(b);
    if (s === "today") today += 1;
    else if (s === "upcoming") upcoming += 1;
    else past += 1;
  }
  $("#statTotal").textContent = String(all.length);
  $("#statToday").textContent = String(today);
  $("#statUpcoming").textContent = String(upcoming);
  $("#statPast").textContent = String(past);
}

function fmtCreated(b) {
  if (!b.created) return "—";
  const d = new Date(b.created);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function render() {
  renderStats();
  const q = ($("#fSearch").value || "").trim().toLowerCase();
  const svc = $("#fService").value;
  const therapist = $("#fTherapist") ? $("#fTherapist").value : "";
  const date = $("#fDate") ? $("#fDate").value : "";
  const status = $("#fStatus") ? $("#fStatus").value : "";
  const sort = $("#fSort") ? $("#fSort").value : "date-asc";
  const list = all.filter((b) => {
    const hay = `${b.name || ""} ${b.email || ""} ${b.service || ""} ${b.therapist || ""} ${b.notes || ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
    if (svc && b.service !== svc) return false;
    if (therapist && b.therapist !== therapist) return false;
    if (date && b.date !== date) return false;
    if (status && bookingStatus(b) !== status) return false;
    return true;
  });
  list.sort((a, b) => {
    if (sort === "created-desc") return String(b.created || "").localeCompare(String(a.created || ""));
    const cmp = String(a.date || "").localeCompare(String(b.date || "")) ||
      String(a.time || "").localeCompare(String(b.time || ""));
    return sort === "date-desc" ? -cmp : cmp;
  });
  $("#count").textContent = list.length + " booking" + (list.length === 1 ? "" : "s");
  $("#empty").hidden = list.length !== 0;
  $("#empty").textContent = all.length === 0 ? "No bookings yet." : "No bookings match your filters.";
  $("#list").innerHTML = list.map((b) => `
    <div class="bk-card">
      <div>
        <strong>${escapeHtml(b.name)}</strong> <span class="bk-meta">· ${escapeHtml(b.email)}</span>
        <div class="bk-meta">
          <span>${escapeHtml(b.date)}</span> at <span>${escapeHtml(b.time)}</span><br>
          ${escapeHtml(b.service)} · with ${escapeHtml(b.therapist)}${b.phone ? "<br>📞 " + escapeHtml(b.phone) : ""}${b.notes ? "<br>📝 " + escapeHtml(b.notes) : ""}
        </div>
      </div>
      <div class="bk-actions">
        <span class="bk-meta" style="margin-top:0">${escapeHtml(fmtCreated(b))}</span>
        <button class="btn-danger" data-id="${escapeHtml(b.id)}">Cancel</button>
      </div>
    </div>`).join("");

  $$("#list .btn-danger").forEach((btn) =>
    btn.addEventListener("click", async () => {
      if (!confirm("Cancel this booking?")) return;
      btn.disabled = true;
      btn.textContent = "Cancelling…";
      try {
        const res = await fetch("/api/bookings/" + encodeURIComponent(btn.dataset.id), { method: "DELETE" });
        if (res.status === 401) { location.replace("/admin"); return; }
        if (!res.ok) throw new Error("HTTP " + res.status);
        await load();
      } catch {
        alert("Could not cancel that booking. Please try again.");
        btn.disabled = false;
        btn.textContent = "Cancel";
      }
    })
  );
}

$("#fSearch").addEventListener("input", render);
$("#fService").addEventListener("change", render);
$("#fTherapist").addEventListener("change", render);
$("#fDate").addEventListener("change", render);
$("#fStatus").addEventListener("change", render);
$("#fSort").addEventListener("change", render);
$("#btnClear").addEventListener("click", () => {
  $("#fSearch").value = "";
  $("#fService").value = "";
  $("#fTherapist").value = "";
  $("#fDate").value = "";
  $("#fStatus").value = "";
  $("#fSort").value = "date-asc";
  render();
});
$("#btnLogout").addEventListener("click", async () => {
  try {
    await fetch("/api/admin/logout", { method: "POST" });
  } catch { /* session already gone */ }
  location.replace("/admin");
});

$("#btnExport").addEventListener("click", async () => {
  const btn = $("#btnExport");
  btn.disabled = true;
  btn.textContent = "Exporting…";
  try {
    const res = await fetch("/api/bookings/export");
    if (res.status === 401) { location.replace("/admin"); return; }
    if (!res.ok) throw new Error("HTTP " + res.status);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const day = new Date().toISOString().slice(0, 10);
    a.download = `apex-bookings-${day}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    alert("Could not export bookings. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Export CSV";
  }
});

load();
