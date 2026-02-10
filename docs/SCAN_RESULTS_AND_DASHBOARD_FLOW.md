# Scan Results & Dashboard Data Flow

This document describes how scan results are stored and displayed across `/scan`, `/scan/results/[id]`, and `/scan/history`.

---

## 1. Where scan results are stored

| Backend | Storage | When used |
|---------|---------|-----------|
| **Postgres (Supabase)** | `scan_results` table | When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set |
| **SQLite** | `project-atlas.db` (or `DATABASE_PATH`) | Dev fallback when Supabase is not configured |

When a scan completes, `db.save_scan_result()` is called. This writes to Postgres when Supabase is configured; otherwise SQLite.

---

## 2. API endpoints and usage

| Endpoint | Method | Auth | Used by | Purpose |
|----------|--------|------|---------|---------|
| `/api/recent` | GET | No | ScannerPage (dashboard) | Global recent scans, sorted by time (newest first) |
| `/api/history` | GET | Yes (when Supabase) | ScanHistoryPage | User-scoped scan history |
| `/api/scan/results/{id}` | GET | No | ScanResultsPageV2, ReportDetailPage | Full scan result for a specific extension |

---

## 3. Sorting by time

- **`/api/recent`**: Backend returns rows ordered by `timestamp DESC` (SQLite) or `scanned_at DESC` (Postgres). The dashboard table displays this order by default.
- **`/api/history`**: Returns user's scans ordered by `created_at DESC`.
- **ScannerPage**: Default sort is `{ key: "timestamp", direction: "desc" }` — most recent first.

---

## 4. Data flow for `/scan` dashboard

1. On mount, ScannerPage calls `databaseService.getRecentScans(25)` → `GET /api/recent?limit=25`
2. Backend: `db.get_recent_scans(limit)` reads from `scan_results` (Postgres or SQLite)
3. Response includes `risk_and_signals`, `metadata`, `scoring_v2` (when available)
4. Frontend enriches scans via `enrichScans(history, { skipFullFetch: true })` to compute signals
5. Table renders with extensions sorted by time (newest first)

---

## 5. Data flow for `/scan/results/[id]`

1. User navigates to `/scan/results/pjafcgbpdclmdeiipolenjgkikeldlji`
2. ScanResultsPageV2 calls `loadResultsById(scanId)` from ScanContext
3. `loadResultsById` fetches `GET /api/scan/results/{id}` 
4. Backend looks up: memory → db (Postgres/SQLite) → file fallback
5. Payload is normalized and rendered

---

## 6. Scan history (authenticated users)

- **`/scan/history`**: Uses `GET /api/history?limit=N` with `Authorization: Bearer <token>`
- Backend joins `user_scan_history` with `scan_results` by `extension_id`
- Returns only scans the user has run (user-scoped)

---

## 7. Summary

- **Postgres**: Used when Supabase is configured; scan results are stored in `scan_results`
- **Dashboard**: `/scan` shows recent scans from `GET /api/recent`, already sorted by time
- **No new API needed**: The existing `/api/recent` and `/api/history` serve the dashboard and scan history
- **UI**: ScanResultsPageV2 transition was improved to avoid flash of "Unable to Display" during normalization
