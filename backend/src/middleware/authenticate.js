import { jwtSecret } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { createAuthenticate } from './authenticateFactory.js'

export const authenticate = createAuthenticate({ prisma, jwtSecret })
