import { withProviderDeadline, readBounded } from './providerHttp.js'

const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/
const failed = () => Object.assign(new Error('Không thể gửi email khôi phục lúc này'), { code: 'EMAIL_DELIVERY_FAILED' })

export const createRecoveryEmailService = ({ env = process.env, fetchImpl = fetch, createTransport, timeoutMs = 10000 } = {}) => {
  const provider = env.EMAIL_PROVIDER || 'smtp'
  const sender = (env.EMAIL_FROM || '').trim()
  const smtpUser = env.SMTP_USER?.trim()
  const smtpPassword = env.SMTP_APP_PASSWORD?.replace(/\s/g, '')
  let origin
  try {
    const url = new URL(env.APP_ORIGIN || (env.CORS_ORIGIN || 'http://localhost:5173').split(',')[0].trim())
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash || (provider === 'brevo' && url.protocol !== 'https:')) throw failed()
    origin = url.origin
  } catch { /* Invalid origin is unconfigured; never forward arbitrary reset links. */ }
  const isConfigured = () => Boolean(origin && (provider === 'smtp' ? smtpUser && smtpPassword && createTransport : provider === 'brevo' && env.BREVO_API_KEY && !/\s/.test(env.BREVO_API_KEY) && emailPattern.test(sender) && env.BREVO_SENDER_VERIFIED === 'true'))
  let transporter
  return {
    isConfigured,
    async send({ recipient, token }) {
      if (!isConfigured() || !emailPattern.test(recipient) || typeof token !== 'string' || !token || token.length > 256) throw failed()
      const resetUrl = new URL('/reset-password', origin)
      resetUrl.searchParams.set('token', token)
      const text = `Bạn đã yêu cầu đặt lại mật khẩu Lumina LMS. Mở liên kết sau trong vòng 30 phút: ${resetUrl.toString()}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`
      try {
        if (provider === 'smtp') {
          transporter ||= createTransport({ service: 'gmail', auth: { user: smtpUser, pass: smtpPassword }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 })
          await transporter.sendMail({ from: `Lumina LMS <${smtpUser}>`, to: recipient, subject: 'Đặt lại mật khẩu Lumina LMS', text })
          return
        }
        await withProviderDeadline(async signal => {
          const response = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
            method: 'POST', redirect: 'error', signal,
            headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ sender: { name: 'Lumina LMS', email: sender }, to: [{ email: recipient }], subject: 'Đặt lại mật khẩu Lumina LMS', textContent: text }),
          })
          if (response.status !== 201) { void response.body?.cancel().catch(() => {}); throw failed() }
          const result = JSON.parse((await readBounded(response, 65536)).toString())
          if (typeof result.messageId !== 'string' || !result.messageId) throw failed()
        }, timeoutMs)
      } catch { throw failed() }
    },
  }
}
