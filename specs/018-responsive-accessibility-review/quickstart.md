# Verify responsive auth

frontend: npm test; npm run lint; npm run build.
Use fresh isolated Compose acceptance stack and existing multi-owner seed/browser
harness. Observe login/register/forgot/missing-reset at390×844/768×1024/1280×800/
1440×900; inspect columns, email width, clipping and horizontal overflow.
Emulate prefers-reduced-motion and inspect spinner animation plus status text.
Exercise three roles without provider/email calls; retain only safe summaries,
no private credentials/profile/reset URLs. Keep historical blocked profiles.
