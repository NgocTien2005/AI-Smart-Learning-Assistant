import { useEffect, useState } from 'react'
import { downloadDocument, fetchDocument } from '../services/api.js'
import { ErrorState, LoadingState } from './ui/Feedback.jsx'

/* eslint react-refresh/only-export-components: off */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
const acceptedExtensions = new Set(['.pdf', '.txt', '.md', '.markdown', '.csv'])
const acceptedMimeTypes = new Set(['application/pdf', 'text/plain', 'text/markdown', 'text/csv'])

export const validateDocumentFile = (file) => {
  if (!file) return 'Hãy chọn tài liệu.'
  if (file.size > MAX_DOCUMENT_BYTES) return 'Tài liệu vượt quá giới hạn 10 MiB.'
  const extension = `.${file.name.split('.').at(-1) || ''}`.toLocaleLowerCase('en')
  if (!acceptedExtensions.has(extension) || !acceptedMimeTypes.has(file.type)) return 'Chỉ hỗ trợ PDF, TXT, Markdown hoặc CSV.'
  return ''
}

const formatSize = (size) => size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(2)} MiB` : `${Math.max(1, Math.round(size / 1024))} KiB`

export function DocumentSelection({ file, error, onChange, onRemove, disabled = false }) {
  return <div className="document-selection">
    <label>Tài liệu<input type="file" accept=".pdf,.txt,.md,.markdown,.csv,application/pdf,text/plain,text/markdown,text/csv" onChange={onChange} disabled={disabled} /></label>
    {file && <div className="selected-file"><span title={file.name}>{file.name}</span><small>{formatSize(file.size)}</small><button type="button" onClick={onRemove} disabled={disabled}>Bỏ chọn</button></div>}
    {error && <p className="field-error" role="alert">{error}</p>}
  </div>
}

function DocumentPreview({ lesson, onClose }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [text, setText] = useState('')
  const isPdf = lesson.documentName?.toLocaleLowerCase('en').endsWith('.pdf')

  useEffect(() => {
    let active = true
    let objectUrl = ''
    fetchDocument(lesson.id).then(async (blob) => {
      if (!active) return
      if (isPdf) {
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
      } else {
        setText(await blob.text())
      }
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    }).finally(() => { if (active) setLoading(false) })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [lesson.id, lesson.documentName, isPdf])

  const downloadFallback = async () => {
    try { await downloadDocument(lesson.id, lesson.documentName) } catch (requestError) { setError(requestError.message) }
  }

  return <section className="document-preview" aria-labelledby="document-preview-title"><header><div><span className="eyebrow">{isPdf ? 'XEM TRƯỚC PDF' : 'XEM NỘI DUNG VĂN BẢN'}</span><h3 id="document-preview-title" title={lesson.documentName}>{lesson.documentName}</h3></div><button type="button" aria-label="Đóng phần xem trước" onClick={onClose}>Đóng</button></header>
    {loading ? <LoadingState>Đang tải tài liệu an toàn…</LoadingState> : error ? <ErrorState title="Không thể xem trước tài liệu">{error}<button type="button" className="ui-button ui-button-secondary" onClick={downloadFallback}>Tải xuống thay thế</button></ErrorState> : isPdf ? <><iframe className="pdf-preview-frame" title={`PDF: ${lesson.documentName}`} src={previewUrl} /><p className="preview-note">Đây là bản xem trước PDF. Lumina chưa trích xuất văn bản PDF cho trợ lý hoặc bài ôn.</p></> : <pre className="text-preview">{text || 'Tài liệu không có nội dung văn bản.'}</pre>}
    {!loading && !error && <button className="ui-button ui-button-secondary" type="button" onClick={downloadFallback}>Tải tài liệu</button>}
  </section>
}

export default DocumentPreview
