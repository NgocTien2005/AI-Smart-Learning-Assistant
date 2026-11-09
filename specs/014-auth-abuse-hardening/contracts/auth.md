# Compatibility and abuse contract

Existing /api/auth login/register/me/forgot/reset/change endpoints retain fields,
normalization, public-user mapper, status/error codes and password boundaries.
New pre-handler failure:429 {code:RATE_LIMITED,error:Vietnamese message} plus
Retry-After integer seconds>=1; identical account-existence-independent limiter.
New absent/non-object JSON body400 {error}; oversized parser413 {error}.
Existing invalid/expired/used reset400 distinct message retained.

Budgets: login100/IP/15m and10/IP/email/15m; registration40/IP/hour;
forgot20/IP/15m and5/IP/email/15m; reset30/IP/15m; change20/user/15m;
join20/user/15m. Shared Nginx IP applies until topology explicitly configured.
No automatic replay of a mutation after429 or unknown outcome.
