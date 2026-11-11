# Research

Decision: shared fixture/cleanup module and feature-oriented files, preserving
test bodies exactly. Existing Vitest default file isolation retained. Alternative
copying all helpers into each file rejected as duplication; manual rewriting
assertions rejected because it risks coverage loss.

Decision: keep existing CI commands/permissions and clarify coverage. Existing
pipeline already executes frontend/backend/isolated LMS and seed matrix; extra
provider or production credentials would violate deterministic basic CI scope.

Primary source: https://vitest.dev/config/isolate.html (reviewed2026-11-09), default true. No no-isolate/coverage gate bypass.
