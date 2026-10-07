import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client.ts'
import { connectionString } from '../config/env.js'

const adapter = new PrismaPg({ connectionString })

export const prisma = new PrismaClient({ adapter })