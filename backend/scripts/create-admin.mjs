import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'
import { validateAdminBootstrap } from '../src/utils/adminBootstrap.js'

const {name,email,password} = validateAdminBootstrap(process.env)

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

