const PAGE_SIZE = 10;

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

function matchesFilter(entry, term, category) {
  const blob = [entry.name, entry.category, entry.good_for, entry.notes].join(" ").toLowerCase();
  const matchesTerm = !term || blob.includes(term);
  const matchesCategory = !category || entry.category === category;
  return matchesTerm && matchesCategory;
}

// Google-style windowed page numbers: always show first/last, a run around
// the current page, and collapse the rest behind an ellipsis rather than
// listing every page when there are a lot of them.
function pageNumbers(current, total) {
  const delta = 2;
  const kept = [];
  for (let page = 1; page <= total; page++) {
    if (page === 1 || page === total || Math.abs(page - current) <= delta) {
      kept.push(page);
    }
  }
  const withEllipsis = [];
  let previous = 0;
  for (const page of kept) {
    if (previous && page - previous > 1) withEllipsis.push("…");
    withEllipsis.push(page);
    previous = page;
  }
  return withEllipsis;
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
  const pagination = document.getElementById("pagination");

  const categories = [...new Set(entries.map((e) => e.category))].sort();
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  }

  const cardsById = new Map(entries.map((entry) => [entry.id, entryCard(entry, status)]));
  let currentPage = 1;

  function goToPage(page) {
    currentPage = page;
    render();
    document.querySelector("main").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderPagination(totalPages) {
    pagination.innerHTML = "";
    if (totalPages <= 1) return;

    const addButton = (label, page, { active = false, disabled = false } = {}) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "page-btn" + (active ? " active" : "");
      btn.textContent = label;
      btn.disabled = disabled;
      btn.setAttribute("aria-current", active ? "page" : "false");
      if (!disabled) btn.addEventListener("click", () => goToPage(page));
      pagination.appendChild(btn);
    };

    addButton("‹ Prev", currentPage - 1, { disabled: currentPage === 1 });
    for (const page of pageNumbers(currentPage, totalPages)) {
      if (page === "…") {
        const span = document.createElement("span");
        span.className = "page-ellipsis";
        span.textContent = "…";
        pagination.appendChild(span);
      } else {
        addButton(String(page), page, { active: page === currentPage });
      }
    }
    addButton("Next ›", currentPage + 1, { disabled: currentPage === totalPages });
  }

  function render() {
    const term = searchInput.value.trim().toLowerCase();
    const category = categorySelect.value;
    const filtered = entries.filter((e) => matchesFilter(e, term, category));

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, currentPage), totalPages);

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageEntries = filtered.slice(start, start + PAGE_SIZE);

    container.innerHTML = "";
    for (const entry of pageEntries) {
      container.appendChild(cardsById.get(entry.id));
    }

    resultCount.textContent = filtered.length
      ? `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"} · page ${currentPage} of ${totalPages}`
      : "0 entries";
    emptyState.hidden = filtered.length !== 0;

    renderPagination(totalPages);
  }

  searchInput.addEventListener("input", () => { currentPage = 1; render(); });
  categorySelect.addEventListener("change", () => { currentPage = 1; render(); });
  render();
}

init();
