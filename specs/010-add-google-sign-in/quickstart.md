# Validation quickstart

1. Follow [private Google setup](../../docs/google-sign-in.md); without a client, disabled/error paths can be verified but actual provider acceptance stays pending.
2. Frontend: `npm test`, `npm run lint`, `npm run build`. Backend: `npm test`, `npm test -- --test-name-pattern="quiz"`, installed Prisma validate/generate.
3. Use the existing quality-CI isolated Compose runner for build/healthy/actual DB identity/HTTP integration and owned-resource cleanup. Never point provisioning at local8081 or edit only TEST_API_URL.
4. Desktop at 1280×800 and 1440×900: preserve two columns; email/password and optional Google states, keyboard/error recovery. Do not capture credentials or personal Google screens.
5. With real configuration, owner privately signs in with password, explicitly links matching Google on Account, signs out and uses Google. Confirm same account/current role and /me verification. Repeat permitted fixtures for three roles, reject unknown/unlinked/disabled account; Google creates zero users. User reports results only. Tokens/screenshots of personal Google UI are not evidence artifacts.
6. Record cwd/command/exit, fixture vs real provider/DB evidence, owned data/cleanup and remaining acceptance tasks in verification/traceability. Leave actual Google task open until observed/reported with real configuration.
