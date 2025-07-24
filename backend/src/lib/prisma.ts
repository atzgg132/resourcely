import { PrismaClient } from '@prisma/client';

// Declare a global variable to hold the Prisma Client instance
declare global {
  var prisma: PrismaClient | undefined;
}

// Initialize Prisma Client, reusing the instance if it exists
export const prisma = global.prisma || new PrismaClient();

// In non-production environments, set the global prisma variable
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}