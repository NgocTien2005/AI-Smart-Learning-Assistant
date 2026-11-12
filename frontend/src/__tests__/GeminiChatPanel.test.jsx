import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import userEvent from '@testing-library/user-event'
import GeminiChatPanel from '../components/GeminiChatPanel.jsx'
import {apiRequest,getSessionGeneration} from '../services/api.js'
vi.mock('../services/api.js',()=>({apiRequest:vi.fn(),getSessionGeneration:vi.fn(()=>0)}))
afterEach(cleanup)
const lesson={id:11,title:'Thuật toán',sourceRevision:1}
const cap={enabled:true,provider:'Gemini',model:'gemini-3.8-flash',source:{type:'LESSON_CONTENT',revision:1,title:lesson.title,characters:100,truncated:false}}
const reply={lessonId:11,sourceRevision:1,sourceType:'LESSON_CONTENT',provider:'Gemini',model:'gemini-3.8-flash',answer:'Thuật toán gồm các bước hữu hạn.',insufficient:false,citations:[{sourceId:'S1',quote:'Thuật toán là dãy bước hữu hạn giải quyết bài toán.'}],questions:[]}
async function select() {
  await screen.findByLabelText('Nguồn gửi tới Gemini')
  fireEvent.change(screen.getByLabelText('Nguồn gửi tới Gemini'),{target:{value:'LESSON_CONTENT'}})
  fireEvent.click(screen.getByRole('checkbox'))
}
const ask=(question='Giải thích thuật toán?')=>{fireEvent.change(screen.getByLabelText('Câu hỏi của bạn'),{target:{value:question}});fireEvent.click(screen.getByRole('button',{name:'Gửi câu hỏi'}))}
beforeEach(()=>{vi.clearAllMocks();getSessionGeneration.mockReturnValue(0);apiRequest.mockResolvedValue(cap)})
describe('Gemini lesson chat',()=>{
  it('supports keyboard sending with Ctrl+Enter and exposes clear in tab order',async()=>{
    const user=userEvent.setup()
    apiRequest.mockResolvedValueOnce(cap).mockResolvedValue(reply)
    render(<GeminiChatPanel lesson={lesson} onClose={()=>{}} />);await select()
    const input=screen.getByLabelText('Câu hỏi của bạn')
    await user.click(input);await user.type(input,'Giai thich bai hoc?')
    await user.keyboard('{Control>}{Enter}{/Control}')
    await screen.findByText(reply.answer)
    expect(apiRequest).toHaveBeenCalledTimes(2)
    input.focus();await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button',{name:'Xóa hội thoại'}))
    await user.keyboard('{Enter}')
    expect(screen.queryByText(reply.answer)).toBeNull()
  })
  it('requires deliberate source and consent, displays real contract reply and bounded follow-up',async()=>{
    apiRequest.mockResolvedValueOnce(cap).mockResolvedValue(reply)
    render(<GeminiChatPanel lesson={lesson} onClose={()=>{}} />)
    await screen.findByLabelText('Câu hỏi của bạn')
    fireEvent.change(screen.getByLabelText('Câu hỏi của bạn'),{target:{value:'Hỏi về bài học'}})
    expect(screen.getByRole('button',{name:'Gửi câu hỏi'}).disabled).toBe(true)
    await select();ask()
    await screen.findByText(reply.answer)
    expect(apiRequest.mock.calls[1][1].body).toContain('"consent":true')
    ask('Cho ví dụ từng bước?')
    await waitFor(()=>expect(apiRequest).toHaveBeenCalledTimes(3))
    const body=JSON.parse(apiRequest.mock.calls[2][1].body)
    expect(body.history).toEqual([{role:'user',content:'Giải thích thuật toán?'},{role:'assistant',content:reply.answer}])
    expect(body.sourceRevision).toBe(1)
  })
  it('preserves input on provider error and never retries automatically',async()=>{
    apiRequest.mockResolvedValueOnce(cap).mockRejectedValueOnce(new Error('Hết hạn mức miễn phí'))
    render(<GeminiChatPanel lesson={lesson} onClose={()=>{}} />);await select();ask()
    await screen.findByRole('alert');expect(screen.getByLabelText('Câu hỏi của bạn').value).toBe('Giải thích thuật toán?')
    expect(apiRequest).toHaveBeenCalledTimes(2)
  })
  it('prevents duplicates, cancels and suppresses a response that ignores abort',async()=>{
    let finish
    apiRequest.mockResolvedValueOnce(cap).mockImplementation(()=>new Promise(r=>{finish=r}))
    render(<GeminiChatPanel lesson={lesson} onClose={()=>{}} />);await select();ask();ask()
    expect(apiRequest).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button',{name:'Dừng chờ'}));finish(reply)
    await waitFor(()=>expect(screen.queryByText(reply.answer)).toBeNull())
    expect(screen.getByLabelText('Câu hỏi của bạn').value).toBe('Giải thích thuật toán?')
  })
  it('resets consent/history and aborts on selected lesson changes',async()=>{
    let finish
    apiRequest.mockResolvedValueOnce(cap).mockImplementationOnce(()=>new Promise(r=>{finish=r})).mockResolvedValue({...cap,source:{...cap.source,revision:2}})
    const view=render(<GeminiChatPanel lesson={lesson} onClose={()=>{}} />);await select();ask()
    view.rerender(<GeminiChatPanel lesson={{...lesson,sourceRevision:2}} onClose={()=>{}} />);finish(reply)
    await screen.findByLabelText('Nguồn gửi tới Gemini')
    expect(screen.getByRole('checkbox').checked).toBe(false);expect(screen.queryByText(reply.answer)).toBeNull()
  })
  it('suppresses a late response after session generation changed',async()=>{
    let finish
    apiRequest.mockResolvedValueOnce(cap).mockImplementationOnce(()=>new Promise(r=>{finish=r}))
    render(<GeminiChatPanel lesson={lesson} onClose={()=>{}} />);await select();ask()
    getSessionGeneration.mockReturnValue(1);finish(reply)
    await waitFor(()=>expect(screen.queryByText(reply.answer)).toBeNull())
  })
  it('explains missing configuration and has no secret entry or provider request',async()=>{
    apiRequest.mockResolvedValue({...cap,enabled:false})
    render(<GeminiChatPanel lesson={lesson} onClose={()=>{}} />)
    await screen.findByText(/Gemini chưa được cấu hình/)
    expect(screen.getByRole('button',{name:'Gửi câu hỏi'}).disabled).toBe(true);expect(apiRequest).toHaveBeenCalledTimes(1)
  })
  it('clears visible history and sharing consent',async()=>{
    apiRequest.mockResolvedValueOnce(cap).mockResolvedValue(reply)
    render(<GeminiChatPanel lesson={lesson} onClose={()=>{}} />);await select();ask();await screen.findByText(reply.answer)
    fireEvent.click(screen.getByRole('button',{name:'Xóa hội thoại'}))
    expect(screen.queryByText(reply.answer)).toBeNull();expect(screen.getByRole('checkbox').checked).toBe(false)
  })
})
