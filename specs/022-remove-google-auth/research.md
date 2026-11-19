# Research

Decision: remove active OAuth modules/config rather than disabled buttons. Rationale: user explicitly retires sign-in/linking; eliminates missing Client ID blocker. Alternative feature flag leaves unwanted UI/API, rejected.

Decision: retain dormant schema/migration history. Rationale: avoids destructive user-data changes and historical migration rewrite. No runtime use beyond private database storage. Drop migration is unnecessary and out of scope.

Decision: preserve Google vendor references in Gemini/Gmail and historical evidence. Rationale: user explicitly wants real Gemini and recovery remains protected. No unknowns or new technology/integration choices require research delegation.
