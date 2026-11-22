import {useEffect,useId,useRef,useState} from 'react'
import {apiRequest,getSessionGeneration} from '../services/api.js'
import Button from './ui/Button.jsx'
import './DemoCloudAssistantPanel.css'

const choices=[['concepts','Các khái niệm liên hệ thế nào?'],['example','Giải thích ví dụ từng bước'],['compare','So sánh hai khái niệm đầu'],['practice','Cách thực hành theo bài học']]
function CloudWorkspace({lesson,onClose}) {
  const id=useId()
  const [capability,setCapability]=useState(null)
  const [error,setError]=useState('')
  const [questionId,setQuestionId]=useState('concepts')
  const [result,setResult]=useState(null)
  const [busy,setBusy]=useState(false)
  const [checking,setChecking]=useState(true)
  const lifetime=useRef({alive:false,pending:false,controller:null})
  useEffect(()=>{
    const state=lifetime.current
    state.alive=true
    const controller=new AbortController()
    const generation=getSessionGeneration()
    apiRequest(`/api/courses/lessons/${lesson.id}/cloud-assistant`,{signal:controller.signal}).then(data=>{
      if(state.alive&&getSessionGeneration()===generation){setCapability(data);setChecking(false)}
    }).catch(e=>{if(state.alive&&e.name!=='AbortError'&&getSessionGeneration()===generation){setError(e.message);setChecking(false)}})
    return()=>{state.alive=false;controller.abort();state.controller?.abort()}
  },[lesson.id])
  async function generate(mode) {
    const state=lifetime.current
    if(!state.alive||state.pending||!capability?.eligible||!capability.enabled)return
    state.pending=true;setBusy(true);setError('');setResult(null)
    const controller=new AbortController(),generation=getSessionGeneration()
    state.controller=controller
    try {
      const data=await apiRequest(`/api/courses/lessons/${lesson.id}/cloud-assistant`,{method:'POST',body:JSON.stringify({mode,questionId}),signal:controller.signal})
      if(!state.alive||generation!==getSessionGeneration())return
      if(data.lessonId!==lesson.id||data.sourceRevision!==lesson.sourceRevision)throw new Error('Nguồn bài học đã thay đổi. Hãy tải lại bài trước khi dùng kết quả.')
      setResult(data)
    } catch(e){if(state.alive&&e.name!=='AbortError'&&generation===getSessionGeneration())setError(e.message)}
    finally{state.pending=false;if(state.alive&&generation===getSessionGeneration())setBusy(false)}
  }
  const enabled=!checking&&!busy&&capability?.enabled&&capability.eligible
  return <section className="demo-cloud-panel" aria-labelledby={id+'-title'} aria-busy={checking||busy}>
    <header><div><span className="eyebrow">GEMINI · CHỈ DỮ LIỆU DEMO</span><h3 id={id+'-title'}>Trợ lý AI cloud</h3></div><Button variant="secondary" onClick={onClose}>Đóng AI cloud</Button></header>
    <p>Chỉ gửi nội dung demo tổng hợp nguyên bản của bài đang chọn và câu hỏi mẫu đến Google khi bạn bấm nút. Gói miễn phí có hạn mức; dữ liệu có thể được Google dùng cải thiện sản phẩm. Không gửi tài liệu thật hoặc câu hỏi riêng tư.</p>
    <p>Công cụ này tạo nội dung bằng model khi được cấu hình. Tra cứu, tóm tắt trích xuất và bài ôn cục bộ vẫn là các công cụ riêng.</p>
    {checking&&<p role="status">Đang kiểm tra điều kiện AI cloud…</p>}
    {capability&&!capability.eligible&&<p role="status">Bài này không phải nguồn demo nguyên bản được phép gửi. Các công cụ cục bộ vẫn dùng được.</p>}
    {capability&&!capability.enabled&&<p role="status">Tính năng AI chưa được bật. Chỉ người quản trị hệ thống mới có thể cấu hình dịch vụ.</p>}
    <label htmlFor={id+'-question'}>Câu hỏi demo</label>
    <select id={id+'-question'} value={questionId} disabled={!enabled} onChange={e=>setQuestionId(e.target.value)}>{choices.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
    <div className="demo-cloud-actions">{[['ask','Hỏi theo nguồn'],['explain','Giải thích'],['summary','Tóm tắt bằng AI'],['quiz','Tạo 3 câu ôn tập']].map(([mode,label])=><Button key={mode} variant="secondary" disabled={!enabled} onClick={()=>generate(mode)}>{label}</Button>)}</div>
    {busy&&<p role="status">Gemini đang xử lý nguồn demo… Không tự gửi lại nếu bị gián đoạn.</p>}
    {error&&<p role="alert">{error}</p>}
    {result&&<div className="demo-cloud-result" aria-live="polite"><p><strong>{result.provider} · {result.model}</strong></p><p className="demo-cloud-answer">{result.answer}</p>{result.questions.map((q,index)=><section key={index}><h4>{index+1}. {q.question}</h4><ol type="A">{q.options.map((o,i)=><li key={i}>{o}</li>)}</ol><details><summary>Xem đáp án gợi ý và căn cứ</summary><p>{q.options[q.correctIndex]} — {q.explanation}</p><blockquote>{q.quote}</blockquote></details></section>)}<h4>Căn cứ từ bài học</h4>{result.citations.map((c,i)=><blockquote key={i}><small>{c.sourceId}</small><p>{c.quote}</p></blockquote>)}<p><a href={`?section=lessons&lessonId=${lesson.id}`}>Đối chiếu bài học đang chọn</a>. AI có thể sai dù trích dẫn hợp lệ; hãy kiểm tra nguồn. Câu ôn tập gợi ý không được lưu hoặc chấm vào bài ôn hiện có.</p></div>}
  </section>
}

export default function DemoCloudAssistantPanel({lesson,onClose,sessionKey=''}) {
  return <CloudWorkspace key={`${lesson.id}-${lesson.sourceRevision}-${sessionKey}`} lesson={lesson} onClose={onClose}/>
}
