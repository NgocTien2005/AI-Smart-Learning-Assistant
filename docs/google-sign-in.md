# Google OAuth has been retired

Feature022 removes Google sign-in and account linking at the user's request. Use email/password and existing forgot/reset recovery. No OAuth Client ID, Client Secret, authorized origins, GIS SDK or provider callback is required. Old challenge/login/link endpoints return404; reload stale frontend clients.

Existing users, passwords, roles, sessions and learning data are preserved. The nullable googleSubject schema column and immutable migration remain dormant compatibility storage; no active runtime reads/updates or public exposure. No destructive unlink/delete migration was run.

This retirement supersedes the active setup guide and feature010 functionality. Historical specs/010-add-google-sign-in evidence remains history; its missing real-provider acceptance is not relabeled as successful. See specs/022-remove-google-auth/verification.md for current tests.

Gemini chat and Gmail SMTP are separate integrations and remain supported. Removing OAuth does not remove the Google provider name from their privacy/setup documentation. See gemini-chat.md and existing email recovery configuration. Do not paste keys/passwords/reset URLs into chat or evidence.
