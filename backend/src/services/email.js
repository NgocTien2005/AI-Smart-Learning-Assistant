import nodemailer from 'nodemailer'
import '../config/env.js'
import { createRecoveryEmailService } from './recoveryEmail.js'

const service = createRecoveryEmailService({ createTransport: options => nodemailer.createTransport(options) })

export const isEmailConfigured = service.isConfigured

export const sendPasswordResetEmail = service.send
