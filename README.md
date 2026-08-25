# 📡 Free Data & API Catalog

A curated, **automatically health-checked** list of free, no-key APIs and datasets worth building a student data project on.

**Live, searchable site: https://vulevu228.github.io/data-catalog/**

## Why this exists

Every course project that needs live data starts the same way: someone spends an hour hunting for a free API that doesn't need a paid key, doesn't die three weeks later, and actually returns something usable. This program has already been through that search four times over ([`tracking_metals`](../tracking_metals), [`earthquake_tracker`](../earthquake_tracker), and a space-weather project - live project) — this catalog turns that search into something reusable by anyone else in the program, instead of every classmate repeating it from scratch.

It isn't a list of links copy-pasted from somewhere else. Every entry is either something a real pipeline in this program is actually built on, or a well-known, genuinely free (no signup-then-paywall) source flagged clearly as unverified until someone actually builds on it.

## What makes this different from a static "awesome-list"

Most curated API lists rot — a third of the links are dead or now require a key within a year. This one doesn't get to, because `.github/workflows/health-check.yml` actually runs on a real schedule (once a day) and pings every entry, writing the result to `status.json`. The site badges each entry "live" or "unreachable" based on that file, not on whoever's memory of whether it still works.

This is also the first project in this series where the scheduled GitHub Actions workflow is the *live* path rather than a dormant placeholder — `tracking_metals` and `earthquake_tracker` both write to a local Postgres database that GitHub's cloud runners can't reach, so their workflows sit disabled. This project has no local database at all — everything it checks is a public URL — so the cloud schedule just works.

## The catalog, right now

**103 sources**, every one requiring **no API key** — that's the one hard filter every entry has to pass, and it was checked live, not assumed. Building this list meant testing well over a hundred candidate URLs one by one: real HTTP requests against each, discarding anything that came back needing a key, blocked by a firewall, 404'd, or was otherwise too unreliable to hand to a classmate in good conscience. About 20 candidates that looked promising on paper didn't survive that pass (dead endpoints, services that quietly added a key requirement, one 403'd behind a WAF even with a browser User-Agent) — those aren't in `entries.json`, on purpose.

`Verified` means a real pipeline in this program is built on it (5 entries, all inherited from `tracking_metals`/`earthquake_tracker`/the space-weather project); `Seed` means it's a well-known free source confirmed working during this pass but not yet load-bearing for a real project here — treat it as a strong lead, not a guarantee. Live up/down status isn't duplicated in this README since it changes daily — check the [live site](https://vulevu228.github.io/data-catalog/) for that, or `status.json` directly.

| Category | Entries | What's in it |
|---|---|---|
| Reference Data | 17 | Geocoding, postal codes, IP lookup, dictionary, color, holidays |
| Entertainment | 23 | Trivia, jokes, recipes, sports, fictional-universe APIs (good for practicing joins/nested data) |
| Government | 10 | US/UK/Canada/Singapore/EU official open-data and statistics APIs |
| Culture & Media | 10 | Museums, libraries, music metadata, Wikipedia/Wikidata |
| Finance | 7 | FX rates, crypto prices, central bank data |
| Weather | 7 | Forecast, air quality, tides, grid carbon intensity |
| Economics | 6 | World Bank, IMF, ECB, OECD, UN Comtrade |
| Developer Tools | 6 | GitHub, GitLab, npm, PyPI, crates.io |
| Space Weather | 4 | Solar flares, Kp-index, ISS tracking, sunrise/sunset |
| Science | 4 | Chemistry, biomedical literature, biodiversity |
| Health | 3 | COVID-19, FDA adverse events, WHO indicators |
| Transit | 3 | Bike-share networks, London Underground status, live flights |
| Geoscience | 2 | Earthquakes, elevation |
| Geopolitics | 1 | GDELT global event database |

Five flagship entries — the ones an actual pipeline in this program depends on:

| Source | Category | Format |
|---|---|---|
| [USGS Earthquake GeoJSON Feed](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) | Geoscience | GeoJSON — powers `earthquake_tracker` |
| [NOAA SWPC Solar Flare Events](https://www.swpc.noaa.gov/products/goes-x-ray-flux) | Space Weather | JSON |
| [NOAA SWPC Planetary K-index](https://www.swpc.noaa.gov/products/planetary-k-index) | Space Weather | JSON |
| [GDELT 2.0 Event Database](https://www.gdeltproject.org/data.html#documentation) | Geopolitics | CSV (zipped) — powers `tracking_metals` |
| [Yahoo Finance quotes (via `yfinance`)](https://pypi.org/project/yfinance/) | Finance | Python objects — powers `tracking_metals` |

The other 98 are individually documented in [`entries.json`](entries.json) — auth type, update cadence, exact endpoint, a "good for" note, and any caveats worth knowing before you build on it — and browsable/searchable on the [live site](https://vulevu228.github.io/data-catalog/). Each source name links to that provider's own human-readable docs page, not the raw API endpoint — clicking through gets you an explanation, not an unformatted JSON dump; the actual no-key endpoint to call from code is shown separately, both in `entries.json` and per-entry on the live site.

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

## How the site is published

Live at **https://vulevu228.github.io/data-catalog/**, served directly by GitHub Pages from the repo root on `main` — no build step, no static site generator. If you're forking this for your own program: enable it once under Settings → Pages → Deploy from a branch → `main` / `/root`, and it stays live automatically after that; every push to `main` (including the daily bot commit to `status.json`) redeploys it within a minute or two.
