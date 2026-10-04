const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // ۱. ساخت جایگاه و واحد سازمانی
  const pos = await prisma.organizationalPosition.create({ data: { Name: 'مدیرعامل' } });
  const unit = await prisma.unit.create({ data: { Name: 'مدیریت' } });

  // ۲. ساخت پرسنل با نقش CEO
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

  // ۳. ساخت یوزر برای ورود (نام کاربری: skazemcnc، رمز عبور: 123456)
  const hash = await bcrypt.hash('123456', 10);
  await prisma.users.create({
    data: {
      Personnel_ID: personnel.Personnel_ID,
      Username: 'skazemcnc', // <--- نام کاربری شما اینجا تنظیم شد
      PasswordHash: hash,
      IsActive: true,
    }
  });

  console.log('✅ مدیرعامل با موفقیت ساخته شد! (نام کاربری: skazemcnc | رمز عبور: 123456)');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());