# Research — primary sources reviewed2026-11-09

Decision: layered bounded IP and IP/email throttling, not permanent account lockout.
Rationale: mitigate spraying/expensive credential work while keeping recovery.
Numbers are Lumina defaults, not OWASP prescriptions. Alternatives: new dependency
or shared Redis store rejected for current single-instance scope; distributed
deployment needs a separate shared-store decision.
[Express brute force](https://expressjs.com/en/advanced/best-practice-security/#prevent-brute-force-attacks-against-authorization),
[OWASP authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html),
[OWASP recovery](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

Decision: retain trust proxy false and hash limiter keys/cap cardinality.
Rationale: supplied forwarded headers must not bypass budgets; shared proxy IP is
an explicit limitation. Alternative blanket trust/fixed hop count unsafe without
verified topology. [Express proxies](https://expressjs.com/en/guide/behind-proxies/).

Decision: shape validation before handlers, bounded existing JSON parser.
[Express5 JSON API](https://expressjs.com/en/5x/api/express/#express.json).

Decision: keep Bearer for compatibility; document storage XSS risk and future cookie
migration requiring CSRF design. Restrictive CORS is not XSS protection. HttpOnly
reduces token theft but cannot prevent XSS making authenticated operations.
[OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html),
[OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

Independent read-only research agent used by managed plan Phase0; no code/secret/provider access.
