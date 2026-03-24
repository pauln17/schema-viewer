import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../generated/prisma/client'

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
})

// Telling TS To ALlow Access to A Property That Will Exist At Runtime, Because TS Can't See Runtime Mutations
const globalForPrisma = global as unknown as { prisma: PrismaClient }

const prisma = globalForPrisma.prisma || new PrismaClient({
    log:
        process.env.NODE_ENV === "development" 
            ? ["query", "info", "warn", "error"] 
            : ["error"],
    adapter
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export { prisma }