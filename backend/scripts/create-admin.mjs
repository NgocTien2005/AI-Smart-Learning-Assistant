import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim()
const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD

if (!name || name.length < 2 || name.length > 80) {
  throw new Error('ADMIN_BOOTSTRAP_NAME must be between 2 and 80 characters.')
}
if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
  throw new Error('ADMIN_BOOTSTRAP_EMAIL must be a valid email address.')
}
if (typeof password !== 'string' || password.length < 12 || password.length > 72) {
  throw new Error('ADMIN_BOOTSTRAP_PASSWORD must be between 12 and 72 characters.')
}

try {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) throw new Error('A user with ADMIN_BOOTSTRAP_EMAIL already exists; no account was changed.')

  const user = await prisma.user.create({
    data: { name, email, password: await bcrypt.hash(password, 12), role: 'ADMIN', isActive: true },
    select: { id: true, name: true, email: true, role: true },
  })
  console.log(`Admin account created: ${user.email} (id ${user.id}).`)
} finally {
  await prisma.$disconnect()
}

