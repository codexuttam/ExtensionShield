-- Persist extension icon bytes for environments with ephemeral filesystem (e.g. Railway).
-- This allows /api/scan/icon/{extension_id} to serve real icons even after restarts.

alter table public.scan_results
add column if not exists icon_base64 text;

alter table public.scan_results
add column if not exists icon_media_type text;

comment on column public.scan_results.icon_base64 is
'Base64-encoded icon bytes captured at scan time for durable icon rendering when extracted files are unavailable.';

comment on column public.scan_results.icon_media_type is
'MIME type for icon_base64 payload (for example image/png, image/webp, image/jpeg, image/svg+xml).';
