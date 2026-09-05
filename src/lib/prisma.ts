import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaMariaDb({
  host: "127.0.0.1",
  port: 3306,
  user: "erpramyco",
  password: "@Sb.1385@11",
  database: "erpramyco_db",
  connectionLimit: 30
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"], // در زمان بیلد بهتر است فقط error ها لاگ شوند تا سرعت بالا برود
  });

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}// auto deploy test
