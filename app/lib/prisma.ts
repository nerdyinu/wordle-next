



import { PrismaClient } from "@prisma/client";

const globalWithPrisma = global as typeof globalThis & {
  prisma: PrismaClient;
};

if (!globalWithPrisma.prisma) {
  globalWithPrisma.prisma = new PrismaClient();
}
const prisma = globalWithPrisma.prisma;

export default prisma;


