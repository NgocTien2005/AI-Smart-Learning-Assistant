import {Router} from 'express'
import {CLOUD_MODEL,createCloudService,proveDemoSource,validateCloudRequest} from '../services/demoCloudAssistant.js'

const messages={CLOUD_INVALID_REQUEST:'Yêu cầu AI demo không hợp lệ.',CLOUD_SOURCE_NOT_ALLOWED:'AI cloud chỉ được dùng nguồn demo tổng hợp nguyên bản; bài này không đủ điều kiện.',CLOUD_NOT_CONFIGURED:'Gemini chưa sẵn sàng. Cần cấu hình API key riêng và xác nhận project miễn phí chưa bật billing.',CLOUD_LIMIT:'Đã chạm giới hạn AI demo hoặc đang có yêu cầu xử lý. Vui lòng chờ rồi chủ động thử lại.',CLOUD_PROVIDER_LIMIT:'Gemini đã hết hạn mức miễn phí. Không tự chuyển sang trả phí.',CLOUD_TIMEOUT:'Gemini phản hồi quá thời gian. Không tự gửi lại yêu cầu.',CLOUD_INVALID_OUTPUT:'Phản hồi Gemini chưa đáp ứng kiểm tra nguồn hoặc cấu trúc. Chưa thể dùng kết quả này.',CLOUD_PROVIDER_UNAVAILABLE:'Chưa thể kết nối Gemini hoặc model chưa khả dụng. Không có fallback trả phí.',CLOUD_SOURCE_UNAVAILABLE:'Chưa xác minh được nguồn demo. Vui lòng thử kiểm tra lại sau.'}
export function createDemoCloudRouter({prisma,authenticate,service=createCloudService({key:process.env.GEMINI_API_KEY||'',freeOnly:process.env.GEMINI_FREE_ONLY_CONFIRMED==='true',enabled:process.env.LUMINA_DEMO_ALLOWED==='true'})}) {
  const router=Router()
  const route=router.route('/:lessonId/cloud-assistant')
  route.all((req,res,next)=>{
    if(!/^[1-9]\d*$/.test(req.params.lessonId)||!Number.isSafeInteger(Number(req.params.lessonId)))return res.status(400).json({error:'ID bài học không hợp lệ',code:'CLOUD_INVALID_REQUEST'})
    if(req.method==='POST')try{req.cloudRequest=validateCloudRequest(req.body)}catch{return res.status(400).json({error:messages.CLOUD_INVALID_REQUEST,code:'CLOUD_INVALID_REQUEST'})}
    next()
  },authenticate)
  const readLesson=req=>prisma.lesson.findUnique({where:{id:Number(req.params.lessonId)},include:{course:{select:{instructorId:true,enrollments:{where:{userId:req.user.id},select:{userId:true}}}}}})
  const allowed=(lesson,user)=>lesson.course.instructorId===user.id||lesson.course.enrollments.some(e=>e.userId===user.id)
  async function handle(req,res) {
    try {
      const lesson=await readLesson(req)
      if(!lesson)return res.status(404).json({error:'Không tìm thấy bài học',code:'CLOUD_NOT_FOUND'})
      if(!allowed(lesson,req.user))return res.status(403).json({error:'Bạn không có quyền xem bài học này',code:'CLOUD_FORBIDDEN'})
      const source=await proveDemoSource(prisma,lesson)
      if(req.method!=='POST')return res.json({enabled:service.configured(),eligible:!!source,provider:'Gemini',model:CLOUD_MODEL,scope:'original-demo-only'})
      if(!source)return res.status(403).json({error:messages.CLOUD_SOURCE_NOT_ALLOWED,code:'CLOUD_SOURCE_NOT_ALLOWED'})
      const controller=new AbortController()
      const cancel=()=>controller.abort()
      res.once('close',cancel)
      let result
      try {result=await service.generate({userId:req.user.id,request:req.cloudRequest,source,signal:controller.signal})}
      finally{res.removeListener('close',cancel)}
      // Discard a delayed result after access/session/source changes.
      const current=await prisma.user.findUnique({where:{id:req.user.id},select:{isActive:true,authVersion:true}})
      if(!current?.isActive||current.authVersion!==req.user.authVersion)return res.status(401).json({error:'Phiên đăng nhập không còn hợp lệ',code:'SESSION_INVALID'})
      const latest=await readLesson(req)
      if(!latest||!allowed(latest,req.user))return res.status(403).json({error:'Quyền truy cập đã thay đổi',code:'CLOUD_FORBIDDEN'})
      const proof=await proveDemoSource(prisma,latest)
      if(!proof||proof.text!==source.text||proof.revision!==source.revision)return res.status(409).json({error:'Nguồn bài học đã thay đổi. Vui lòng tải lại bài học.',code:'CLOUD_SOURCE_CHANGED'})
      return res.json({...result,lessonId:lesson.id,sourceRevision:source.revision})
    } catch(error) {
      const code=Object.hasOwn(messages,error.code)?error.code:'CLOUD_SOURCE_UNAVAILABLE'
      return res.status(Object.hasOwn(messages,error.code)?error.status||502:503).json({error:messages[code],code})
    }
  }
  route.get(handle).post(handle)
  return router
}
