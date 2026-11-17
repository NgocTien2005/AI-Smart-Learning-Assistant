# Plan: Targeted security patches

Technical context: backend Node24+/Express5/Prisma7, no frontend code change. Upload router -> existing multer boundary -> bounded documentProcessing.getDocument/getTextContent -> shared lesson source. Email service Nodemailer -> authorized SMTP only when requested. Admin bootstrap023/role/auth/session paths stay intact. No schema/data migration.

Constitution: I preserve contracts, II resource checks unchanged, III no redesign, IV install/audit/unit+actual isolated gates separate, V no data deletion/secret logs/egress. PASS pre/post design; hooks file absent. Review actual dependency/API sources first, no exploit claimed from audit.

Phase0 research: baseline npm audit backend6(3High/3Moderate),frontend0. Primary advisories patched PDF>=6.2.108, multer>=2.5, Nodemailer>=10.1.4; body-parser>=2.4,fast-uri>=3.1.9,qs>6.16.0. Metadata PDF Node>=22.13||>=24 compatible with image24. Research review checks6major legacy API/fixtures. Parent ranges allow transitive refresh; no overrides to incompatible versions.

Phase1 design: backend/package.json and package-lock.json targeted direct fixes then npm update named transitives only, no force. npm ci regenerates same Prisma client from unchanged schema. Existing backend/test/documentProcessing.test.js + demo source/PDF fixtures test actual parser, auth/request-boundary/assignment/quiz suites cover production adapters; do not add mirrored version-only tests. Config/runner tests unchanged.

Execution: spec/clarify/plan/checklist/tasks/analyze -> install/update -> npm ci -> npm audit --omit=dev -> backend full/quiz and CI29 -> Docker build/healthy/isolated integration when operator engine ready -> docs/evidence, read-only analysis/converge, local coherent commits. Record blocked integration if unavailable. Default privately configured backend must not be recreated and lose key merely to install new test images.

Risks: PDF major parsing/font/native module changes; Node25 host not proof of Alpine Node24 image. Preserve canonical PDF/text limits and source hash. No real provider/email acceptance rerun needed solely for parser/dependency changes; if SMTP integration changed unexpectedly stop and diagnose. No paid fallback, remote write or public rollout. Temporary stack on023, no silent merge/main change.

Reproduced remediation: new compressed-input production regression returned500 for a malformed gzip body (bounded completion, not an exploit reproduction). Global app handler only classified SyntaxError; known zlib decoder errors status400 fell through. Map only Z_DATA_ERROR/Z_BUF_ERROR with status400 to a generic400, never expose parser message/body. Add actual isolated HTTP case and rerun backend/quiz/integration; no valid API or schema change.
