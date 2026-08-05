/* APEX — admin bookings view */
"use strict";

const $ = (s) => document.querySelector(s);
let all = [];

async function load() {
  try {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    all = (data.bookings || []).slice().sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    render();
  } catch {
    $("#list").innerHTML = `<p class="empty">Could not reach the API. Is the server running?</p>`;
  }
}

function render() {
  const q = ($("#fSearch").value || "").toLowerCase();
  const svc = $("#fService").value;
  const list = all.filter((b) => {
    const hay = `${b.name} ${b.email} ${b.service} ${b.therapist} ${b.notes}`.toLowerCase();
    return hay.includes(q) && (!svc || b.service === svc);
  });
  $("#count").textContent = list.length + " booking" + (list.length === 1 ? "" : "s");
  $("#empty").hidden = list.length !== 0;
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
        <span class="bk-meta" style="margin-top:0">${new Date(b.created).toLocaleString()}</span>
        <button class="btn-danger" data-id="${b.id}">Cancel</button>
      </div>
    </div>`).join("");

  $$("#list .btn-danger").forEach((btn) =>
    btn.addEventListener("click", async () => {
      if (!confirm("Cancel this booking?")) return;
      await fetch("/api/bookings/" + btn.dataset.id, { method: "DELETE" });
      load();
    })
  );
}

function $$(s) { return [...document.querySelectorAll(s)]; }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

$("#fSearch").addEventListener("input", render);
$("#fService").addEventListener("change", render);

fetch("/api/bookings").then((r) => r.json()).then((d) => {
  const svcs = [...new Set((d.bookings || []).map((b) => b.service))];
  $("#fService").innerHTML = `<option value="">All services</option>` + svcs.map((s) => `<option>${s}</option>`).join("");
});

load();
