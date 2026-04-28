# ImgBed Upload Token Security: Short-Lived JWT Design

**Date:** 2026-04-28
**Status:** Approved
**Problem:** The static `IMGBED_UPLOAD_TOKEN` is embedded in the frontend HTML via `window.__RUNTIME_CONFIG__`, visible to anyone who views page source. This allows unauthorized uploads to the Cloudflare R2 storage behind ImgBed.
**Goal:** Remove the static token from the frontend while preserving direct browser-to-ImgBed uploads (no Go server bandwidth bottleneck).

---

## Solution: Backend-Issued Short-Lived JWT

Replace the static bearer token with a short-lived JWT issued by the Blog backend on demand. The frontend requests a token before uploading, then uses it to upload directly to ImgBed. ImgBed validates the JWT signature and expiry instead of comparing a static string.

### Upload Flow (Before vs After)

**Before:**
```
Browser --[static IMGBED_UPLOAD_TOKEN]--> ImgBed
```

**After:**
```
Browser --> GET /api/v1/admin/upload-token (Blog Backend, authenticated)
         <-- { token: "<5min JWT>", expires_in: 300 }
Browser --[5min JWT]--> ImgBed (validates signature + expiry)
```

File bytes never pass through the Go server. Only a lightweight token-fetch call is added.

---

## 1. Token Issuance (Blog Backend)

### New Endpoint

- **Route:** `GET /api/v1/admin/upload-token`
- **Auth:** Requires existing Blog admin JWT (same middleware as other `/admin/` routes)
- **Response:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 300
  }
  ```

### JWT Claims

```json
{
  "sub": "imgbed-upload",
  "iss": "blog-backend",
  "iat": 1714300000,
  "exp": 1714300300
}
```

- Algorithm: HMAC-SHA256
- TTL: 5 minutes
- Claims are minimal — the token only asserts "this is an authorized upload request"

### New Configuration

```toml
[upload.imgbed]
signing_secret = "your-shared-secret-here"
```

Environment variable override: `IMGBED_SIGNING_SECRET`

This secret is shared between Blog Backend and ImgBed but never appears in frontend code or HTML.

---

## 2. JWT Validation (ImgBed Side)

### Auth Logic Change

**Current:**
```
Authorization: Bearer <value>
  -> value === static token? PASS : REJECT 401
```

**New:**
```
Authorization: Bearer <value>
  -> Try JWT verify (HMAC-SHA256, IMGBED_SIGNING_SECRET)
     -> Signature valid AND not expired? PASS
     -> Else: try static token match (backward compat, transition period)
        -> Match? PASS : REJECT 401
```

### New Environment Variable

- `IMGBED_SIGNING_SECRET` — same value as Blog Backend's `signing_secret`
- Configured in Cloudflare Pages environment variables

### Backward Compatibility

During the transition period, ImgBed accepts both JWT and static token. After confirming the new flow works, the static token path can be removed.

---

## 3. Frontend Changes

### Removed

| Item | Location |
|------|----------|
| `IMGBED_UPLOAD_TOKEN` injection | `frontend/docker-entrypoint.sh` |
| `getImgBedUploadToken()` function | `frontend/src/config/runtime.ts` |
| `VITE_IMGBED_UPLOAD_TOKEN` | `frontend/.env.example` |
| `IMGBED_UPLOAD_TOKEN` env var for frontend container | `docker-compose.personal.yml`, `docker-compose.yml` |

### Added: `fetchUploadToken()` in `frontend/src/api/index.ts`

```
fetchUploadToken():
  1. Check cache: have a valid token (>60s until expiry)? Return it.
  2. No -> call GET /api/v1/admin/upload-token (with Blog JWT)
  3. Cache the token and its expiry timestamp
  4. Return the token
```

### Upload Flow Changes

- `ensureImgBedConfig()` checks only `IMGBED_BASE` (no longer checks token)
- Before uploading, call `await fetchUploadToken()` to get the short-lived token
- Use it in the `Authorization: Bearer` header to ImgBed

### Chunked Upload Handling

- 5-minute TTL covers a typical chunked upload (init -> chunks -> merge)
- For extreme cases (>4 minutes elapsed), check token freshness before each chunk and refresh if needed

### Fallback Behavior (Unchanged)

- If `IMGBED_BASE` is not configured: use backend relay (`POST /api/v1/uploads/images`)
- If ImgBed direct upload fails with a network error: fall back to backend relay
- If `fetchUploadToken()` fails: fall back to backend relay

---

## 4. Configuration and Deployment

### Configuration Matrix

| Service | Config Key | Source |
|---------|-----------|--------|
| Blog Backend | `[upload.imgbed] signing_secret` | `config.toml` / `config.personal.toml` |
| Blog Backend | `IMGBED_SIGNING_SECRET` env override | `.env.personal`, Docker Compose |
| ImgBed | `IMGBED_SIGNING_SECRET` env var | Cloudflare Pages environment settings |

### Config Cleanup

| Location | Change |
|----------|--------|
| `docker-compose.personal.yml` | Remove `IMGBED_UPLOAD_TOKEN` from frontend container env |
| `docker-compose.yml` | Same |
| `frontend/docker-entrypoint.sh` | Remove `IMGBED_UPLOAD_TOKEN` injection line |
| `frontend/.env.example` | Remove `VITE_IMGBED_UPLOAD_TOKEN` |
| `.env.personal.example` | Remove frontend `IMGBED_UPLOAD_TOKEN`, add `IMGBED_SIGNING_SECRET` |

### Zero-Downtime Deployment Order

1. **ImgBed first:** Deploy JWT validation + keep static token fallback
2. **Blog Backend:** Deploy `/admin/upload-token` endpoint + `signing_secret` config
3. **Blog Frontend:** Deploy `fetchUploadToken()` flow, remove static token references
4. **ImgBed cleanup (optional):** Remove static token fallback path

### Error Handling

| Scenario | Behavior |
|----------|----------|
| `fetchUploadToken()` network error | Fall back to backend relay |
| ImgBed returns 401 (token expired) | Clear cache, re-fetch token, retry once |
| Retry still 401 | Fall back to backend relay |

---

## 5. Scope Boundaries

### In Scope

- Blog Backend: new upload-token endpoint, signing secret config
- Blog Frontend: token fetch/cache, remove static token references, config cleanup
- ImgBed: JWT validation in auth middleware (user modifies separately)

### Out of Scope

- ImgBed implementation details (user owns that codebase separately)
- Rotating the existing static token (can be done independently)
- Other credentials in config files (separate security concern)
- Changes to the backend relay upload path (stays as-is for fallback)
