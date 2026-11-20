import {useEffect,useId,useRef,useState} from 'react'
import {apiRequest,getSessionGeneration} from '../services/api.js'
import Button from './ui/Button.jsx'
import './GeminiChatPanel.css'

function ChatWorkspace({lesson,onClose}) {
  const id=useId()
  const [capability,setCapability]=useState(null)
  const [checking,setChecking]=useState(true)
  const [retry,setRetry]=useState(0)
  const [selected,setSelected]=useState('')
  const [consent,setConsent]=useState(false)
  const [question,setQuestion]=useState('')
  const [turns,setTurns]=useState([])
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [busy,setBusy]=useState(false)
  const lifetime=useRef({alive:false,pending:false,sequence:0,controller:null})
  const scrollEnd=useRef(null)
  const friendlyError=(e)=>{
    if(e?.code==='CLOUD_PROVIDER_LIMIT'||e?.status===429)return 'Hết hạn mức miễn phí hoặc đang vượt giới hạn. Hãy thử lại sau.'
    if(e?.code==='CLOUD_TIMEOUT'||e?.status===504)return 'Dịch vụ phản hồi chậm. Chưa gửi lại câu hỏi; bạn có thể thử lại sau.'
    if(e?.code==='CLOUD_LIMIT')return 'Đang xử lý một yêu cầu hoặc đã chạm giới hạn trong thời gian ngắn.'
    if(e?.code==='CLOUD_INVALID_OUTPUT')return 'Câu trả lời chưa đủ điều kiện kiểm tra nên chưa được hiển thị.'
    if(e?.code==='CLOUD_NOT_CONFIGURED')return 'Tính năng hỏi đáp chưa được bật.'
    if(e?.code==='CHAT_NO_SOURCE'||e?.code==='CHAT_SOURCE_CHANGED')return e.message
    if(e?.code==='CHAT_FORBIDDEN'||e?.code==='SESSION_INVALID')return e.message
    if(e?.status===503||e?.code==='CLOUD_PROVIDER_UNAVAILABLE')return 'Không thể kết nối dịch vụ hỏi đáp lúc này. Hãy thử lại sau.'
    return e?.message||'Không thể gửi câu hỏi. Hãy thử lại.'
  }
  useEffect(()=>{
    const state=lifetime.current
    state.alive=true
    const controller=new AbortController(),generation=getSessionGeneration()
    apiRequest(`/api/courses/lessons/${lesson.id}/gemini-chat`,{signal:controller.signal}).then(data=>{
      if(state.alive&&getSessionGeneration()===generation){setCapability(data);setChecking(false);setError('')}
    }).catch(e=>{
      if(state.alive&&e.name!=='AbortError'&&getSessionGeneration()===generation){setError(e.message);setChecking(false)}
    })
    return()=>{state.alive=false;state.sequence++;controller.abort();state.controller?.abort()}
  },[lesson.id,retry])
  useEffect(()=>{scrollEnd.current?.scrollIntoView?.({block:'nearest'})},[turns,busy])
  function cancel() {
    const state=lifetime.current
    state.sequence++;state.controller?.abort();state.pending=false
    setBusy(false);setNotice('Đã dừng chờ. Google có thể đã nhận yêu cầu; không tự gửi lại.')
  }
  function clear() {
    cancel();setTurns([]);setQuestion('');setSelected('');setConsent(false);setError('');setNotice('Đã xóa hội thoại trong phiên này.')
  }
  async function send(event) {
    event.preventDefault()
    const state=lifetime.current,source=capability?.source
    if(!state.alive||state.pending||!capability?.enabled||!source||!selected||!consent||!question.trim()||question.length>2000)return
    state.pending=true;setBusy(true);setError('');setNotice('')
    const sequence=++state.sequence,controller=new AbortController(),generation=getSessionGeneration(),prompt=question.trim()
    state.controller=controller
    const current=()=>state.alive&&sequence===state.sequence&&generation===getSessionGeneration()
    try {
      const data=await apiRequest(`/api/courses/lessons/${lesson.id}/gemini-chat`,{method:'POST',body:JSON.stringify({question:prompt,history:turns.slice(-6).map(({role,content})=>({role,content})),sourceType:selected,sourceRevision:source.revision,consent:true}),signal:controller.signal})
      if(!current())return
      if(data.lessonId!==lesson.id||data.sourceRevision!==source.revision||data.sourceType!==selected)throw new Error('Nguồn đã thay đổi. Hãy tải lại và chọn lại nguồn.')
      setTurns(previous=>[...previous,{role:'user',content:prompt},{role:'assistant',content:data.answer,result:data}]);setQuestion('')
    } catch(e) {
      if(current()&&e.name!=='AbortError'){
        setError(friendlyError(e))
        if([401,403,409].includes(e.status)){setTurns([]);setSelected('');setConsent(false)}
      }
    } finally {if(current()){state.pending=false;setBusy(false)}}
  }
  const source=capability?.source
  const ready=!checking&&capability?.enabled&&source
  return <section className="gemini-chat" aria-labelledby={id+'-title'}>
    <header className="gemini-chat-header"><div><span className="eyebrow">HỎI ĐÁP THEO BÀI HỌC</span><h3 id={id+'-title'}>Hỏi đáp bài học</h3><p>Chọn nội dung và đặt câu hỏi để hiểu sâu hơn bài học đang chọn.</p></div><Button variant="secondary" onClick={onClose}>Đóng</Button></header>
    <div className="gemini-chat-source">
      <label htmlFor={id+'-source'}>Nội dung dùng để trả lời</label>
      <select id={id+'-source'} value={selected} disabled={checking||busy||!source} onChange={event=>{setSelected(event.target.value);setConsent(false);setTurns([])}}>
        <option value="">Chọn phần nội dung muốn hỏi</option>
        {source&&<option value={source.type}>{source.type==='DOCUMENT'?'Văn bản tài liệu':'Nội dung bài học'} · {source.title}</option>}
      </select>
      {source&&<p>{source.characters.toLocaleString('vi-VN')} ký tự{source.truncated?' · Chỉ gửi phần trích tối đa 12.000 ký tự; nguồn đã bị giới hạn.':'.'} Chỉ nguồn của bài học này được gửi.</p>}
      <details className="gemini-chat-privacy"><summary>Thông tin chia sẻ</summary><p>Câu hỏi, tối đa 3 lượt hỏi/đáp gần nhất và nội dung đã chọn sẽ được gửi tới Google khi bạn bấm Gửi. Không gửi thông tin cá nhân, nhạy cảm hoặc tài liệu mật.</p></details>
      <label className="gemini-chat-consent"><input type="checkbox" checked={consent} disabled={!selected||busy} onChange={event=>setConsent(event.target.checked)} /><span>Tôi có quyền chia sẻ nguồn đã chọn với Google và đồng ý gửi nội dung trên.</span></label>
    </div>
    {checking&&<p role="status">Đang kiểm tra tính năng hỏi đáp…</p>}
    {!checking&&!capability&&<Button variant="secondary" onClick={()=>{setChecking(true);setRetry(value=>value+1)}}>Kiểm tra lại</Button>}
    {capability&&!source&&<p role="status">Bài học chưa có nội dung để trả lời. Thêm nội dung trực tiếp hoặc tài liệu PDF có lớp chữ.</p>}
    {capability&&!capability.enabled&&<p role="status">Tính năng hỏi đáp chưa được bật. Chỉ người quản trị hệ thống mới có thể cấu hình dịch vụ.</p>}
    <div className="gemini-chat-conversation" role="log" aria-label="Hội thoại Gemini" aria-live="polite" aria-busy={busy}>
      {!turns.length&&<p className="gemini-chat-empty">Bạn muốn hiểu rõ phần nào? Chọn nội dung rồi đặt câu hỏi, ví dụ “Giải thích khái niệm chính bằng một ví dụ trong bài”.</p>}
      {turns.map((turn,index)=><article className={`gemini-chat-turn gemini-chat-${turn.role}`} key={index}><strong>{turn.role==='user'?'Bạn':'Kết quả trả lời'}</strong><p>{turn.content}</p>{turn.result&&<><details><summary>Nội dung tham khảo ({turn.result.citations.length})</summary>{turn.result.citations.map((citation,i)=><blockquote key={i}><small>{citation.sourceId}</small><p>{citation.quote}</p></blockquote>)}</details><small>{turn.result.model} · Hãy đối chiếu nội dung tham khảo với bài học.</small></>}</article>)}
      {busy&&<p role="status">Đang tìm câu trả lời…</p>}<div ref={scrollEnd}/>
    </div>
    {error&&<p className="gemini-chat-error" role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
    <form onSubmit={send}>
      <label htmlFor={id+'-question'}>Câu hỏi của bạn</label>
      <textarea id={id+'-question'} rows={3} maxLength={2000} value={question} disabled={busy} onChange={event=>setQuestion(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();event.currentTarget.form.requestSubmit()}}} placeholder="Hỏi về nguồn bài học đã chọn…" aria-describedby={id+'-hint'} />
      <p id={id+'-hint'} className="gemini-chat-hint">{question.length}/2000 · Ctrl+Enter để gửi. Hội thoại chỉ giữ trong màn hình hiện tại.</p>
      <div className="gemini-chat-actions"><Button type="submit" disabled={!ready||!selected||!consent||!question.trim()||busy}>Gửi câu hỏi</Button>{busy&&<Button variant="secondary" onClick={cancel}>Dừng chờ</Button>}<Button variant="secondary" onClick={clear}>Xóa hội thoại</Button></div>
    </form>
  </section>
}

export default function GeminiChatPanel({lesson,onClose,sessionKey=''}) {
  return <ChatWorkspace key={`${lesson.id}-${lesson.sourceRevision}-${sessionKey}`} lesson={lesson} onClose={onClose}/>
}
