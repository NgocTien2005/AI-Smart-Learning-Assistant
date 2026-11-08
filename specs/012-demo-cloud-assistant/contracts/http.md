# HTTP contract
- GET /api/courses/lessons/:lessonId/cloud-assistant: authenticated+course-access;200 {enabled:boolean,eligible:boolean,provider:"Gemini",model:"gemini-3.8-flash",scope:"original-demo-only"}. No external call or content response.
- POST same path: exact JSON {mode:"ask"|"explain"|"summary"|"quiz",questionId:"concepts"|"example"|"compare"|"practice"}. No additional fields. IDs positive safe integers; invalid400 before query.
-200 {provider,model,mode,answer:string,insufficient:boolean,citations:[{sourceId,quote}],questions:[{question,options:[4strings],correctIndex:0..3,explanation,sourceId,quote}],lessonId,sourceRevision}. Nonquiz questions[]; quiz3questions and answer brief. Source IDs/quotes verified against approved original; output always untrusted display text.
- Errors {error:string,code:string}:401 auth,403 access/source,404 missing,400 validation,503 disabled,429 budget/busy/cooldown,502 provider/invalid output,504 timeout. Never raw provider body, model thought, API key, token or request.
- No writes to existing chat or quiz attempts; no provider request from GET or denied POST.
