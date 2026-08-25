# 📡 Free Data & API Catalog

A curated, **automatically health-checked** list of free, no-key APIs and datasets worth building a student data project on. Live page: `<GitHub Pages URL, once published>`.

## Why this exists

Every course project that needs live data starts the same way: someone spends an hour hunting for a free API that doesn't need a paid key, doesn't die three weeks later, and actually returns something usable. This program has already been through that search four times over ([`tracking_metals`](../tracking_metals), [`earthquake_tracker`](../earthquake_tracker), and a space-weather project) — this catalog turns that search into something reusable by anyone else in the program, instead of every classmate repeating it from scratch.

It isn't a list of links copy-pasted from somewhere else. Every entry is either something a real pipeline in this program is actually built on, or a well-known, genuinely free (no signup-then-paywall) source flagged clearly as unverified until someone actually builds on it.

## What makes this different from a static "awesome-list"

Most curated API lists rot — a third of the links are dead or now require a key within a year. This one doesn't get to, because `.github/workflows/health-check.yml` actually runs on a real schedule (once a day) and pings every entry, writing the result to `status.json`. The site badges each entry "live" or "unreachable" based on that file, not on whoever's memory of whether it still works.

This is also the first project in this series where the scheduled GitHub Actions workflow is the *live* path rather than a dormant placeholder — `tracking_metals` and `earthquake_tracker` both write to a local Postgres database that GitHub's cloud runners can't reach, so their workflows sit disabled. This project has no local database at all — everything it checks is a public URL — so the cloud schedule just works.

## How it's put together

| Piece | What it does |
|---|---|
| `entries.json` | The catalog itself — one JSON object per API/dataset, with category, URL, auth requirements, format, update cadence, and a plain-language "good for" note. |
| `scripts/check_health.py` | Reads `entries.json`, does a live GET against each entry, and writes the result (`up`/`down`, HTTP status, response time) to `status.json`. |
| `status.json` | Machine-generated, overwritten daily by the workflow. Not meant to be hand-edited. |
| `.github/workflows/health-check.yml` | Runs `check_health.py` once a day (`workflow_dispatch` also available for an on-demand run) and commits `status.json` back if it changed. |
| `index.html` / `app.js` / `style.css` | A small dependency-free static site: search box, category filter, and a status badge per entry, reading `entries.json` and `status.json` directly. Deployed via GitHub Pages, no build step. |

## Adding an entry

Open `entries.json` and add an object with this shape:

```json
{
  "id": "short-kebab-case-id",
  "name": "Human-readable name",
  "category": "Pick an existing category if it fits, or add a new one",
  "url": "https://the-actual-endpoint-or-package-page",
  "docs_url": "https://link-to-docs",
  "auth": "none | free key required | paid",
  "format": "JSON | GeoJSON | CSV | ...",
  "update_cadence": "how often the data actually changes",
  "good_for": "one plain-language sentence on what kind of project this suits",
  "provenance": "verified in production - powers <project> | catalog seed - not yet used in a project in this program, worth verifying before relying on it",
  "notes": "anything a future user would want to know before committing to this source (optional)"
}
```

Be honest in `provenance` — an entry someone has actually built a working pipeline on is worth more to the next person than one that merely looked promising in a README. Open a pull request; the health-check workflow will pick the new entry up on its next scheduled run (or trigger it manually via `workflow_dispatch`).

## Running the health check locally

```bash
pip install -r requirements.txt
python scripts/check_health.py
```

Writes/overwrites `status.json` in the repo root — the same file the live site reads.

## Publishing the site

The static site (`index.html`, `app.js`, `style.css`, `entries.json`, `status.json`) is plain files with no build step — GitHub Pages can serve straight from the repo root on `main` (Settings → Pages → Deploy from a branch → `main` / `/root`). Not yet enabled on this repo; that's a one-time manual step once this is pushed and reviewed.
