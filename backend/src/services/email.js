import nodemailer from 'nodemailer'
import { appOrigin, smtpAppPassword, smtpUser } from '../config/env.js'

let transporter

export const isEmailConfigured = () => Boolean(smtpUser && smtpAppPassword)

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpAppPassword },
    })
  }

  return transporter
}

export const sendPasswordResetEmail = async ({ recipient, token }) => {
  const resetUrl = new URL('/reset-password', appOrigin)
  resetUrl.searchParams.set('token', token)

  await getTransporter().sendMail({
    from: `Lumina LMS <${smtpUser}>`,
    to: recipient,
    subject: 'Đặt lại mật khẩu Lumina LMS',
    text: `Bạn đã yêu cầu đặt lại mật khẩu Lumina LMS. Mở liên kết sau trong vòng 30 phút: ${resetUrl.toString()}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`,
    html: `<p>Bạn đã yêu cầu đặt lại mật khẩu Lumina LMS.</p><p><a href="${resetUrl.toString()}">Đặt lại mật khẩu</a></p><p>Liên kết có hiệu lực trong 30 phút và chỉ dùng được một lần.</p><p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
  })
}
