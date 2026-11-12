# Lesson chat HTTP contract

Authenticated `GET|POST /api/courses/lessons/:lessonId/gemini-chat`.

GET: `{enabled, provider:'Gemini', model, source:{type,revision,title,characters,truncated}|null}`; no provider request, no source text beyond authorized lesson metadata. POST body exactly `{question,history,sourceType,sourceRevision,consent:true}` (bounds in data-model). No provider/model/URL/tool overrides. Success200 validated provider reply plus lessonId/sourceRevision/sourceType; questions always[].

400 invalid shape/ID/consent/history;401 missing/expired/revoked session;403 current owner/enrollment denial (including ADMIN without enrollment/ownership);404 missing lesson;409 source selection/revision/fingerprint changed;422 no usable source;429 shared local or provider quota;503 missing server readiness;502 provider/output errors;504 deadline. Errors `{error,code}` with static safe messages, no raw provider response or content logs.

Before provider: exact validation→auth→lesson access→server source→type/revision match→readiness/limit. After: current user isActive/authVersion→current owner/enrollment→source fingerprint/title/type/revision comparison. Client disconnect aborts; no automatic retry. No database writes in chat.

Legacy `/cloud-assistant` finite contract/source proof is retained. It shares only limiter/transport, never inherits free-text request permissions.
