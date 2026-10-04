const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const bcrypt = require('bcryptjs');

// تنظیم آداپتور دقیقاً مثل فایل lib/prisma.ts
const adapter = new PrismaMariaDb({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "erpramyco"
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const pos = await prisma.organizationalPosition.create({ data: { Name: 'مدیرعامل' } });
  const unit = await prisma.unit.create({ data: { Name: 'مدیریت' } });

  const personnel = await prisma.personnel.create({
    data: {
      Full_Name: 'مدیر عامل شرکت',
      Personnel_Code: 'CE0001',
      Role: 'CEO',
      Position_ID: pos.Position_ID,
      Unit_ID: unit.Unit_ID,
      IsActive: true,
      IsApproved: true,
    }
  });

  const hash = await bcrypt.hash('123456', 10);
  await prisma.users.create({
    data: {
      Personnel_ID: personnel.Personnel_ID,
      Username: 'skazemcnc',
      PasswordHash: hash,
      IsActive: true,
    }
  });

  console.log('✅ مدیرعامل با موفقیت ساخته شد! (نام کاربری: skazemcnc | رمز عبور: 123456)');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
