import { PrismaClient } from '@prisma/client'

// Reset cache on schema reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __prismaClientVersion?: string
}

const currentVersion = 'v5-group-config-fields'

if (globalForPrisma.__prismaClientVersion !== currentVersion) {
  globalForPrisma.prisma = undefined
  globalForPrisma.__prismaClientVersion = currentVersion
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db