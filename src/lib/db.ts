import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Neon's free tier suspends when idle; the first connection after a wake-up
// can exceed Prisma's 5s default, so allow more time to connect / get a slot.
function withTimeouts(url: string | undefined): string | undefined {
  if (!url || /connect_timeout=/.test(url)) return url
  return `${url}${url.includes('?') ? '&' : '?'}connect_timeout=30&pool_timeout=30`
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: withTimeouts(process.env.DATABASE_URL),
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db