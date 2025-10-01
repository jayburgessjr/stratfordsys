import { PrismaClient } from '@prisma/client'

// PrismaClient singleton for production optimization
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Prevent multiple instances of PrismaClient in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect()
}

// Transaction helper
export async function withTransaction<T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(fn)
}

// Query optimization helpers
export const queryOptions = {
  // Standard pagination
  pagination: (page: number = 1, limit: number = 50) => ({
    skip: (page - 1) * limit,
    take: Math.min(limit, 100), // Max 100 items per page
  }),

  // Time-based filtering
  timeRange: (startDate: Date, endDate?: Date) => ({
    gte: startDate,
    ...(endDate && { lte: endDate }),
  }),

  // Common includes for performance
  userWithPortfolios: {
    portfolios: {
      include: {
        positions: true,
        trades: {
          orderBy: { createdAt: 'desc' as const },
          take: 10,
        },
      },
    },
  },

  portfolioWithDetails: {
    positions: {
      include: {
        trades: {
          orderBy: { executedAt: 'desc' as const },
          take: 5,
        },
      },
    },
    strategies: true,
  },
} as const