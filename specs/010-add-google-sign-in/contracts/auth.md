# Additive Google contracts

All requests are same-origin JSON through `/api`; Google credential is transient and never logged. Errors `{error, code?}`. Existing password endpoints/publicUser unchanged.

| Method/path | Request | Success | Denial |
| --- | --- | --- | --- |
| POST /api/auth/google/challenge | `{intent: "login"}` or `"link"`; link requires Bearer | 200 `{challengeId, nonce, expiresIn:300}` + HttpOnly SameSite=Lax binding cookie | 400 intent, 401 invalid link session, 429 bound rate/capacity, 503 unconfigured |
| POST /api/auth/google/login | `{challengeId, credential}` + cookie | 200 `{user,token}` using existing mapper/JWT | 400 shape, 401 challenge/provider invalid, 403 unlinked/disabled, 503 config/provider unavailable |
| GET /api/auth/google/link | authenticated | 200 `{linked:boolean}` | existing 401 |
| POST /api/auth/google/link | authenticated `{challengeId,credential}` + cookie | 200 `{linked:true}` | 400 shape, 401 stale session/challenge/provider, 409 mismatched email/occupied link, 503 config/provider unavailable |

Only stable subject lookup authorizes login; no email lookup/user creation. Linking rereads owner and compares version/email/current link, then conditionally writes with uniqueness handling. Distinct error codes for GOOGLE_* do not expire an unrelated existing Lumina session; AUTH_REQUIRED/SESSION_INVALID retain existing semantics. Unexpected errors return generic safe JSON without provider response logs.

GIS uses `client_id`, server nonce, popup callback, `auto_select:false`, no One Tap prompt. Google ID token is POSTed in JSON body, never query or browser storage. Callback validity is checked before and after async operations; session generation/location/attempt lifetimes prevent stale installation.
