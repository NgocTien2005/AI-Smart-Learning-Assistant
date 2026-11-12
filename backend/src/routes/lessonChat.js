import {Router} from 'express'
import {CLOUD_MODEL,createCloudService} from '../services/demoCloudAssistant.js'
import {selectChatSource,validateChatRequest} from '../services/lessonChat.js'

const messages={
  CHAT_INVALID_REQUEST:'Câu hỏi, lịch sử hoặc xác nhận chia sẻ không hợp lệ.',
  CLOUD_NOT_CONFIGURED:'Gemini chưa sẵn sàng. Chạy cấu hình Chat Gemini trong terminal riêng, xác nhận Free và billing đã tắt.',
  CLOUD_LIMIT:'Đang có yêu cầu xử lý hoặc đã chạm giới hạn Chat Gemini. Chờ ít nhất 20 giây rồi chủ động thử lại.',
  CLOUD_PROVIDER_LIMIT:'Gemini đã hết hạn mức miễn phí. Không tự chuyển sang trả phí.',
  CLOUD_TIMEOUT:'Gemini phản hồi quá thời gian. Không tự gửi lại; câu hỏi vẫn được giữ.',
  CLOUD_INVALID_OUTPUT:'Phản hồi Gemini chưa đáp ứng kiểm tra cấu trúc hoặc trích dẫn. Hãy kiểm tra nguồn trước khi thử lại.',
  CLOUD_PROVIDER_UNAVAILABLE:'Chưa thể kết nối Gemini hoặc model chưa khả dụng. Không có câu trả lời thay thế.',
  CHAT_UNAVAILABLE:'Chưa thể kiểm tra nguồn bài học. Vui lòng thử lại sau.',
}
export function createLessonChatRouter({prisma,authenticate,service=createCloudService({key:process.env.GEMINI_API_KEY||'',freeOnly:process.env.GEMINI_FREE_ONLY_CONFIRMED==='true',enabled:process.env.GEMINI_CHAT_ALLOWED==='true',chat:true})}) {
  const router=Router()
  const route=router.route('/:lessonId/gemini-chat')
  route.all((req,res,next)=>{
    if(!/^[1-9]\d*$/.test(req.params.lessonId)||!Number.isSafeInteger(Number(req.params.lessonId)))return res.status(400).json({error:messages.CHAT_INVALID_REQUEST,code:'CHAT_INVALID_REQUEST'})
    if(req.method==='POST')try{req.chatRequest=validateChatRequest(req.body)}catch{return res.status(400).json({error:messages.CHAT_INVALID_REQUEST,code:'CHAT_INVALID_REQUEST'})}
    next()
  },authenticate)
  const readLesson=req=>prisma.lesson.findUnique({where:{id:Number(req.params.lessonId)},include:{course:{select:{instructorId:true,enrollments:{where:{userId:req.user.id},select:{userId:true}}}}}})
  const allowed=(lesson,user)=>lesson.course.instructorId===user.id||lesson.course.enrollments.some(e=>e.userId===user.id)
  async function handle(req,res) {
    try {
      const lesson=await readLesson(req)
      if(!lesson)return res.status(404).json({error:'Không tìm thấy bài học',code:'CHAT_NOT_FOUND'})
      if(!allowed(lesson,req.user))return res.status(403).json({error:'Bạn không có quyền xem bài học này',code:'CHAT_FORBIDDEN'})
      const source=selectChatSource(lesson)
      if(req.method!=='POST')return res.json({enabled:service.configured(),provider:'Gemini',model:CLOUD_MODEL,source:source?{type:source.sourceType,revision:source.revision,title:source.title,characters:source.text.length,truncated:source.truncated}:null})
      if(!source)return res.status(422).json({error:'Bài học chưa có đủ văn bản để trò chuyện. PDF cần lớp văn bản; không hỗ trợ OCR.',code:'CHAT_NO_SOURCE'})
      if(req.chatRequest.sourceRevision!==source.revision||req.chatRequest.sourceType!==source.sourceType)return res.status(409).json({error:'Nguồn đã thay đổi. Hãy tải lại và chọn lại nguồn.',code:'CHAT_SOURCE_CHANGED'})
      const controller=new AbortController(),cancel=()=>controller.abort()
      res.once('close',cancel)
      let result
      try{result=await service.generate({userId:req.user.id,request:req.chatRequest,source,signal:controller.signal})}
      finally{res.removeListener('close',cancel)}
      if(res.destroyed)return
      const current=await prisma.user.findUnique({where:{id:req.user.id},select:{isActive:true,authVersion:true}})
      if(!current?.isActive||current.authVersion!==req.user.authVersion)return res.status(401).json({error:'Phiên đăng nhập không còn hợp lệ',code:'SESSION_INVALID'})
      const latest=await readLesson(req)
      if(!latest||!allowed(latest,req.user))return res.status(403).json({error:'Quyền truy cập đã thay đổi',code:'CHAT_FORBIDDEN'})
      const proof=selectChatSource(latest)
      if(!proof||proof.revision!==source.revision||proof.fingerprint!==source.fingerprint)return res.status(409).json({error:'Nguồn đã thay đổi. Hãy tải lại và chọn lại nguồn.',code:'CHAT_SOURCE_CHANGED'})
      return res.json({...result,lessonId:lesson.id,sourceRevision:source.revision,sourceType:source.sourceType})
    } catch(error) {
      if(res.destroyed)return
      const code=Object.hasOwn(messages,error.code)?error.code:'CHAT_UNAVAILABLE'
      return res.status(code==='CHAT_UNAVAILABLE'?503:error.status||502).json({error:messages[code],code})
    }
  }
  route.get(handle).post(handle)
  return router
}
