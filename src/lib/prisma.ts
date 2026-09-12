import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaMariaDb({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "erpramyco",
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}