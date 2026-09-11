const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQQB2Tn8_mVtAnFzLnO3-uoSWDjS7eY-w_ZPbRQPnL8bKQDjDk-SEZkBImS83YzHMSrOT5ESqoUiFDC/pub?gid=0&single=true&output=csv";

function linkButton(url, label, cls) {
  const u = (url || "").trim();
  if (!u) return "";
  const safe = u.replace(/"/g, "&quot;");
  return `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="dl-btn ${cls}">${label}</a>`;
}

function setStatus(msg) {
  const el = document.getElementById("tableStatus");
  el.textContent = msg;
  el.style.display = msg ? "block" : "none";
}

function addCheckboxFilter(api, colIdx) {
  const column = api.column(colIdx);
  const headerCell = $(column.header());
  const title = headerCell.text();
  headerCell.empty();

  const container = $(`
    <div style="position:relative; display:flex; align-items:center; gap:6px;">
      <span style="font-weight:600;">${title}</span>
      <button type="button" class="filter-btn">Filter ▾</button>
      <div class="filter-panel"
        style="display:none; position:absolute; top:28px; left:0; z-index:9999;
               padding:10px; min-width:220px; max-height:260px; overflow:auto;">
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <button type="button" class="select-all">All</button>
          <button type="button" class="clear-all">None</button>
        </div>
        <div class="options"></div>
      </div>
    </div>
  `);

  const button = container.find(".filter-btn");
  const panel = container.find(".filter-panel");
  const optionsDiv = container.find(".options");

  function parseCellValues(cell) {
    return String(cell ?? "").split(",").map(s => s.trim()).filter(Boolean);
  }
  function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const tokenSet = new Set();
  column.data().each(function(d) { parseCellValues(d).forEach(t => tokenSet.add(t)); });
  const values = Array.from(tokenSet).sort((a,b) => a.localeCompare(b, undefined, { numeric:true, sensitivity:"base" }));

  for (const v of values) {
    optionsDiv.append(`
      <label style="display:flex; align-items:center; gap:8px; margin:4px 0; cursor:pointer;">
        <input type="checkbox" class="opt" value="${v.replace(/"/g, "&quot;")}" checked>
        <span>${v}</span>
      </label>
    `);
  }

  function applyFilter() {
    const checked = optionsDiv.find("input.opt:checked").map(function(){ return $(this).val(); }).get();
    if (checked.length === 0) { column.search("a^", true, false).draw(); return; }
    const escaped = checked.map(escapeRegex).join("|");
    const regex = "(?:^|\\s*,\\s*)(?:" + escaped + ")(?:\\s*,\\s*|$)";
    column.search(regex, true, false).draw();
  }

  button.on("click", function(e){ e.stopPropagation(); $(".filter-panel").not(panel).hide(); panel.toggle(); });
  $(document).on("click", function(){ panel.hide(); });
  panel.on("click", function(e){ e.stopPropagation(); });
  panel.find(".select-all").on("click", function(){ optionsDiv.find("input.opt").prop("checked", true); applyFilter(); });
  panel.find(".clear-all").on("click", function(){ optionsDiv.find("input.opt").prop("checked", false); applyFilter(); });
  optionsDiv.on("change", "input.opt", applyFilter);

  headerCell.append(container);
}

function buildTableFromRows(rows) {
  const requiredHeaders = ["Name","Creature Type","Theme","CL","Description","Download Stat Block","Download JSON"];
  const sample = rows[0] || {};
  const missing = requiredHeaders.filter(h => !(h in sample));
  if (missing.length) throw new Error("Missing columns: " + missing.join(", "));

  const tbody = document.querySelector("#creatureTable tbody");
  tbody.innerHTML = "";

  for (const r of rows) {
    const hasAny = requiredHeaders.some(h => String(r[h] ?? "").trim() !== "");
    if (!hasAny) continue;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${(r["Name"] ?? "").toString()}</td>
      <td>${(r["Creature Type"] ?? "").toString()}</td>
      <td>${(r["Theme"] ?? "").toString()}</td>
      <td>${(r["CL"] ?? "").toString()}</td>
      <td>${(r["Description"] ?? "").toString()}</td>
      <td>${linkButton(r["Download Stat Block"], "PNG", "dl-btn-png")}</td>
      <td>${linkButton(r["Download JSON"], "JSON", "dl-btn-json")}</td>
    `;
    tbody.appendChild(tr);
  }

  document.getElementById("creatureTable").style.display = "";
  setStatus("");

  const table = $("#creatureTable").DataTable({
    pageLength: 25,
    columnDefs: [{ targets: [5,6], orderable: false, searchable: false }]
  });

  addCheckboxFilter(table, 1); // Creature Type
  addCheckboxFilter(table, 2); // Theme
  addCheckboxFilter(table, 3); // CL
}

(function loadSheet() {
  setStatus("Loading data…");
  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      try {
        if (!results.data.length) { setStatus("No rows found."); return; }
        buildTableFromRows(results.data);
      } catch(err) {
        console.error(err);
        setStatus("Error: " + err.message);
      }
    },
    error: function(err) {
      console.error(err);
      setStatus("Failed to load data. Check that the sheet is published as CSV.");
    }
  });
})();

  // ─── Online Tools dropdown ───
