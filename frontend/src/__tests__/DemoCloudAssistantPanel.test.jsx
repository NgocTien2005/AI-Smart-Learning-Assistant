import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import DemoCloudAssistantPanel from '../components/DemoCloudAssistantPanel.jsx'
import {apiRequest,getSessionGeneration} from '../services/api.js'
vi.mock('../services/api.js',()=>({apiRequest:vi.fn(),getSessionGeneration:vi.fn()}))
const lesson={id:11,title:'Bài demo',sourceRevision:1}
const capability={enabled:true,eligible:true,provider:'Gemini',model:'gemini-3.8-flash'}
const output={provider:'Gemini',model:'gemini-3.8-flash',lessonId:11,sourceRevision:1,answer:'Giải thích có dẫn nguồn cho bài demo.',questions:[],citations:[{sourceId:'S1',quote:'Thuật toán là dãy bước hữu hạn giải quyết bài toán.'}]}
beforeEach(()=>{vi.resetAllMocks();getSessionGeneration.mockReturnValue(0)})
afterEach(cleanup)
describe('demo cloud explicit scoped interaction',()=>{
  it('reads capability only, disables all mutations without config and exposes no key input',async()=>{
    apiRequest.mockResolvedValue({...capability,enabled:false})
    render(<DemoCloudAssistantPanel lesson={lesson} onClose={()=>{}} />)
    await screen.findByText(/Tính năng AI chưa được bật/)
    expect(screen.getByRole('button',{name:'Hỏi theo nguồn'}).disabled).toBe(true)
    expect(apiRequest).toHaveBeenCalledTimes(1)
    expect(apiRequest.mock.calls[0][1].method).toBeUndefined()
    expect(screen.queryByRole('textbox')).toBeNull()
  })
  it('requires an explicit action, sends only finite fields, renders escaped text and citations',async()=>{
    apiRequest.mockResolvedValueOnce(capability).mockResolvedValueOnce(output)
    render(<DemoCloudAssistantPanel lesson={lesson} onClose={()=>{}} />)
    const button=screen.getByRole('button',{name:'Hỏi theo nguồn'})
    await waitFor(()=>expect(button.disabled).toBe(false))
    expect(apiRequest).toHaveBeenCalledTimes(1)
    fireEvent.change(screen.getByLabelText('Câu hỏi demo'),{target:{value:'example'}})
    fireEvent.click(button)
    await screen.findByText(output.answer)
    expect(JSON.parse(apiRequest.mock.calls[1][1].body)).toEqual({mode:'ask',questionId:'example'})
    expect(screen.getByText(output.citations[0].quote)).toBeTruthy()
    expect(screen.getByRole('link',{name:'Đối chiếu bài học đang chọn'}).getAttribute('href')).toContain('lessonId=11')
  })
  it('does not replay failed generation and permits a deliberate new request',async()=>{
    apiRequest.mockResolvedValueOnce(capability).mockRejectedValueOnce(new Error('Hết hạn mức miễn phí')).mockResolvedValueOnce(output)
    render(<DemoCloudAssistantPanel lesson={lesson} onClose={()=>{}} />)
    const b=screen.getByRole('button',{name:'Tóm tắt bằng AI'})
    await waitFor(()=>expect(b.disabled).toBe(false));fireEvent.click(b)
    expect((await screen.findByRole('alert')).textContent).toContain('Hết hạn mức')
    expect(apiRequest).toHaveBeenCalledTimes(2)
    fireEvent.click(b);await screen.findByText(output.answer)
    expect(apiRequest).toHaveBeenCalledTimes(3)
  })
  it('drops late results after lesson change and prevents duplicate pending sends',async()=>{
    let finish
    apiRequest.mockResolvedValueOnce(capability).mockImplementationOnce(()=>new Promise(r=>{finish=r})).mockResolvedValueOnce(capability)
    const view=render(<DemoCloudAssistantPanel lesson={lesson} onClose={()=>{}} />)
    const b=screen.getByRole('button',{name:'Giải thích'})
    await waitFor(()=>expect(b.disabled).toBe(false));fireEvent.click(b);fireEvent.click(b)
    expect(apiRequest).toHaveBeenCalledTimes(2)
    view.rerender(<DemoCloudAssistantPanel lesson={{...lesson,id:12}} onClose={()=>{}} />)
    await act(async()=>{finish(output)})
    expect(screen.queryByText(output.answer)).toBeNull()
  })
  it('drops late results after session replacement and rejects changed source revision',async()=>{
    let finish
    apiRequest.mockResolvedValueOnce(capability).mockImplementationOnce(()=>new Promise(r=>{finish=r}))
    render(<DemoCloudAssistantPanel lesson={lesson} onClose={()=>{}} />)
    const b=screen.getByRole('button',{name:'Giải thích'})
    await waitFor(()=>expect(b.disabled).toBe(false));fireEvent.click(b)
    getSessionGeneration.mockReturnValue(1)
    await act(async()=>finish(output))
    expect(screen.queryByText(output.answer)).toBeNull()
  })
  it('does not show a response generated from a different source revision',async()=>{
    apiRequest.mockResolvedValueOnce(capability).mockResolvedValueOnce({...output,sourceRevision:99})
    render(<DemoCloudAssistantPanel lesson={lesson} onClose={()=>{}} />)
    const b=screen.getByRole('button',{name:'Giải thích'})
    await waitFor(()=>expect(b.disabled).toBe(false));fireEvent.click(b)
    expect((await screen.findByRole('alert')).textContent).toContain('Nguồn bài học đã thay đổi')
    expect(screen.queryByText(output.answer)).toBeNull()
  })
})
