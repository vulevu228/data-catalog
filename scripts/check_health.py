import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

BASE_DIR = Path(__file__).resolve().parent.parent
ENTRIES_FILE = BASE_DIR / "entries.json"
STATUS_FILE = BASE_DIR / "status.json"

# yfinance has no documented HTTP endpoint of its own - its "url" field
# points at the PyPI project page for humans to read, not something a GET
# can meaningfully check. Fetching it would only confirm pypi.org is up,
# not that Yahoo's data actually still works, so it's skipped rather than
# reported as a false pass or fail.
SKIP_IDS = {"yahoo-finance-yfinance"}


def resolve_check_url(entry):
    if entry["id"] == "gdelt-events-v2":
        aligned = datetime.now(timezone.utc).replace(second=0, microsecond=0)
        aligned = aligned.replace(minute=(aligned.minute // 15) * 15)
        return entry["url"].format(TIMESTAMP=aligned.strftime("%Y%m%d%H%M%S"))
    return entry["url"]


def check_one(entry):
    url = resolve_check_url(entry)
    started = time.monotonic()
    try:
        # stream=True so a large payload (e.g. GDELT's zip) isn't pulled
        # fully into memory just to confirm the endpoint is alive.
        response = requests.get(url, timeout=15, stream=True)
        elapsed_ms = round((time.monotonic() - started) * 1000)
        response.close()
        ok = response.status_code < 400
        return {
            "status": "up" if ok else "down",
            "http_status": response.status_code,
            "response_ms": elapsed_ms,
        }
    except requests.RequestException as e:
        return {
            "status": "down",
            "http_status": None,
            "response_ms": None,
            "error": str(e)[:200],
        }


def main():
    entries = json.loads(ENTRIES_FILE.read_text(encoding="utf-8"))
    checked_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    results = {}
    for entry in entries:
        if entry["id"] in SKIP_IDS:
            results[entry["id"]] = {"status": "not_checked", "reason": "not a directly-fetchable URL"}
            print(f"SKIP  {entry['id']}")
            continue

        result = check_one(entry)
        result["checked_at"] = checked_at
        results[entry["id"]] = result
        print(f"{result['status'].upper():5} {entry['id']} ({result.get('http_status')}, {result.get('response_ms')}ms)")

    STATUS_FILE.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

    down = [eid for eid, r in results.items() if r["status"] == "down"]
    if down:
        print(f"\n{len(down)} entr{'y is' if len(down) == 1 else 'ies are'} down: {', '.join(down)}")


if __name__ == "__main__":
    sys.exit(main())
