async function loadJSON(path, fallback) {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

function statusBadge(entryId, status) {
  const result = status[entryId];
  if (!result || result.status === "not_checked") {
    return { label: "not auto-checked", cls: "status-unknown" };
  }
  if (result.status === "up") {
    return { label: `live · ${result.response_ms}ms`, cls: "status-up" };
  }
  if (result.status === "down") {
    return { label: "unreachable", cls: "status-down" };
  }
  return { label: "unknown", cls: "status-unknown" };
}

function entryCard(entry, status) {
  const badge = statusBadge(entry.id, status);
  const el = document.createElement("article");
  el.className = "entry";
  el.dataset.searchBlob = [
    entry.name,
    entry.category,
    entry.good_for,
    entry.notes,
  ].join(" ").toLowerCase();
  el.dataset.category = entry.category;

  el.innerHTML = `
    <div class="entry-head">
      <h2 class="entry-name"><a href="${entry.docs_url}" target="_blank" rel="noopener">${entry.name}</a></h2>
      <div class="badges">
        <span class="badge category">${entry.category}</span>
        <span class="badge">${entry.auth === "none" ? "no key" : entry.auth}</span>
        <span class="badge ${badge.cls}">${badge.label}</span>
      </div>
    </div>
    <p class="entry-meta"><strong>Format:</strong> ${entry.format} &nbsp;·&nbsp; <strong>Updates:</strong> ${entry.update_cadence}</p>
    ${entry.url !== entry.docs_url ? `<p class="entry-endpoint"><strong>API endpoint (no key needed):</strong> <a href="${entry.url}" target="_blank" rel="noopener"><code>${entry.url}</code></a></p>` : ""}
    <p class="entry-notes"><strong>Good for:</strong> ${entry.good_for}</p>
    ${entry.notes ? `<p class="entry-notes">${entry.notes}</p>` : ""}
    <p class="entry-provenance">${entry.provenance}</p>
  `;
  return el;
}

function applyFilter(container, searchTerm, category) {
  const term = searchTerm.trim().toLowerCase();
  let visible = 0;
  for (const card of container.children) {
    const matchesTerm = !term || card.dataset.searchBlob.includes(term);
    const matchesCategory = !category || card.dataset.category === category;
    const show = matchesTerm && matchesCategory;
    card.hidden = !show;
    if (show) visible++;
  }
  return visible;
}

async function init() {
  const [entries, status] = await Promise.all([
    loadJSON("entries.json", []),
    loadJSON("status.json", {}),
  ]);

  const container = document.getElementById("entries");
  const searchInput = document.getElementById("search");
  const categorySelect = document.getElementById("category-filter");
  const resultCount = document.getElementById("result-count");
  const emptyState = document.getElementById("empty-state");

  const categories = [...new Set(entries.map((e) => e.category))].sort();
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  }

  for (const entry of entries) {
    container.appendChild(entryCard(entry, status));
  }

  const updateResults = () => {
    const visible = applyFilter(container, searchInput.value, categorySelect.value);
    resultCount.textContent = `${visible} of ${entries.length} entries`;
    emptyState.hidden = visible !== 0;
  };

  searchInput.addEventListener("input", updateResults);
  categorySelect.addEventListener("change", updateResults);
  updateResults();
}

init();
