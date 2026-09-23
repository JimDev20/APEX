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
}

function fmtCreated(b) {
  if (!b.created) return "—";
  const d = new Date(b.created);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function render() {
  const q = ($("#fSearch").value || "").trim().toLowerCase();
  const svc = $("#fService").value;
  const list = all.filter((b) => {
    const hay = `${b.name || ""} ${b.email || ""} ${b.service || ""} ${b.therapist || ""} ${b.notes || ""}`.toLowerCase();
    return hay.includes(q) && (!svc || b.service === svc);
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

load();
