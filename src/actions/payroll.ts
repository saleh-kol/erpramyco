"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { getMonth, getYear } from "date-fns-jalali";

// ============================================================
//  موتور محاسبه فیش حقوقی + گردش کار دومرحله‌ای تایید
//  حسابدار (Draft/Rejected → ویرایش + تایید) → مدیرعامل
//  (Pending_CEO → ثبت جریمه + تایید/رد) → نمایش نهایی به کارمند
// ============================================================

// ✅ هماهنگ با صفحه تنظیمات حقوق: کارکرد استاندارد ماهانه = ۱۹۲ ساعت
const STANDARD_MONTH_HOURS = 192; // ۲۴ روز کاری × ۸ ساعت
const STANDARD_DAY_HOURS = 8;            // یک روز کاری استاندارد
const INSURANCE_EMPLOYEE_PERCENT = 7;    // بیمه سهم کارمند (درصد)
const PENALTY_DEDUCTION_CODE = "PENALTY";

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

// اقلام مزایای ثابت ماهانه (برای تفکیک Total_Allowances از مزد کارکردی)
const ALLOWANCE_LABELS = ["حق مسکن", "حق اولاد", "کمک هزینه اقلام مصرفی خانوار", "سایر مزایا", "پایه سنوات"];

const toNum = (v: any) => Number(v ?? 0) || 0;
const rial = (n: number) => Math.round(Number(n) || 0);

// ============================================================
//  احراز هویت و دسترسی (هم‌الگو با actions/roles.ts)
// ============================================================
async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  return prisma.users.findUnique({
    where: { User_ID: session.userId },
    include: {
      Personnel: { include: { OrganizationalPosition: true, Unit: true } },
      UserPageAccess: true,
    },
  });
}

// حسابدار = کاربری که مسیر /dashboard/payroll برایش باز است (یا مدیرعامل)
async function requirePayrollAccess() {
  const user = await getCurrentUser();
  if (!user?.Personnel) return { user: null, error: "نشست نامعتبر است — دوباره وارد شوید" };
  const isCEO = user.Personnel.Role === "CEO";
  const hasRoute = (user.UserPageAccess || []).some(a => a.Route === "/dashboard/payroll");
  if (!isCEO && !hasRoute) return { user: null, error: "شما به بخش فیش‌های حقوقی دسترسی ندارید" };
  return { user, error: null };
}

async function requireCEO() {
  const user = await getCurrentUser();
  if (!user?.Personnel) return { user: null, error: "نشست نامعتبر است — دوباره وارد شوید" };
  if (user.Personnel.Role !== "CEO") return { user: null, error: "این عملیات فقط برای مدیرعامل مجاز است" };
  return { user, error: null };
}

// ============================================================
//  دسته‌بندی ساعت کارکرد ماهانه از PR_Daily_Reports
//  - فقط گزارش‌های تاییدشده: Manager_Reviewed / Finance_Processed
//  - ساعت موثر = Work_Hours × (Manager_Score ÷ ۱۰۰)
//  - جمعه: روز هفته = ۵ (استاندارد JS Date: یکشنبه=۰ ... جمعه=۵)
//  - تعطیل رسمی: تاریخ در جدول PR_Holidays
//  - روز عادی: تا ۸ ساعت «عادی»، مازاد «اضافه‌کاری»
// ============================================================
function bucketizeReports(reports: any[], holidaySet: Set<string>) {
  let regular = 0, overtime = 0, friday = 0, holiday = 0;
  for (const rep of reports) {
    const rawScore = rep.Manager_Score == null ? 100 : toNum(rep.Manager_Score);
    const score = rawScore > 0 ? rawScore : 100;
    const hours = toNum(rep.Work_Hours) * (score / 100);
    if (hours <= 0) continue;

    const d = new Date(rep.Report_Date);
    const dow = d.getDay(); // ⚠️ جمعه = ۵ طبق استاندارد JS
    const isHoliday = holidaySet.has(d.toDateString());

    if (isHoliday)      holiday += hours;
    else if (dow === 5) friday += hours;
    else {
      regular += Math.min(hours, STANDARD_DAY_HOURS);
      overtime += Math.max(0, hours - STANDARD_DAY_HOURS);
    }
  }
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return { regular: r2(regular), overtime: r2(overtime), friday: r2(friday), holiday: r2(holiday) };
}

// ============================================================
//  ساخت ردیف‌های فیش از پارامترهای مالی + کارکرد ماه
//  فرمول‌ها (هماهنگ با PayrollSettingsClient):
//    مزد هر ساعت عادی = Base_Monthly_Salary ÷ ۱۹۲
//    اضافه‌کاری      = ساعتی × ساعت × Overtime_Multiplier (مثلا 1.40)
//    جمعه/تعطیل      = ساعتی × ساعت × (۱ + درصد ÷ ۱۰۰)
//    مزایا و پایه سنوات = مقادیر ثابت ماهانه
//    بیمه سهم کارمند = ۷٪ × (ناخالص − حق اولاد)
// ============================================================
type EngineRow = { Detail_Type: "Earning" | "Deduction"; Amount: number; Description: string };

function buildEngineRows(fin: any, buckets: { regular: number; overtime: number; friday: number; holiday: number }): EngineRow[] {
  const hourly = toNum(fin.Base_Monthly_Salary) / STANDARD_MONTH_HOURS;
  const otMult = toNum(fin.Overtime_Multiplier) > 0 ? toNum(fin.Overtime_Multiplier) : 1.40;
  const holPct = toNum(fin.Holiday_Hour_Multiplier);  // درصد اضافه بر ساعتی
  const friPct = toNum(fin.Friday_Hour_Multiplier);   // درصد اضافه بر ساعتی

  const rows: EngineRow[] = [];

  if (buckets.regular > 0)
    rows.push({ Detail_Type: "Earning", Amount: hourly * buckets.regular, Description: `مزد مستمر (${buckets.regular} ساعت کارکرد عادی)` });
  if (buckets.overtime > 0)
    rows.push({ Detail_Type: "Earning", Amount: hourly * buckets.overtime * otMult, Description: `اضافه کاری (${buckets.overtime} ساعت × ${otMult})` });
  if (buckets.friday > 0)
    rows.push({ Detail_Type: "Earning", Amount: hourly * buckets.friday * (1 + friPct / 100), Description: `کارکرد جمعه (${buckets.friday} ساعت × ۱+${friPct}٪)` });
  if (buckets.holiday > 0)
    rows.push({ Detail_Type: "Earning", Amount: hourly * buckets.holiday * (1 + holPct / 100), Description: `کارکرد روز تعطیل (${buckets.holiday} ساعت × ۱+${holPct}٪)` });

  rows.push({ Detail_Type: "Earning", Amount: toNum(fin.Housing_Allowance),     Description: "حق مسکن" });
  rows.push({ Detail_Type: "Earning", Amount: toNum(fin.Child_Allowance),       Description: "حق اولاد" });
  rows.push({ Detail_Type: "Earning", Amount: toNum(fin.Household_Allowance),   Description: "کمک هزینه اقلام مصرفی خانوار" });
  rows.push({ Detail_Type: "Earning", Amount: toNum(fin.Other_Benefits),        Description: "سایر مزایا" });
  rows.push({ Detail_Type: "Earning", Amount: toNum(fin.Seniority_Daily_Base) * 30, Description: "پایه سنوات (ماهانه)" });

  return rows;
}

const isAllowanceDesc = (desc: any) => ALLOWANCE_LABELS.some(l => String(desc || "").startsWith(l));

// بازمحاسبه جمع‌های هدر از روی ردیف‌ها
async function recalcTotals(tx: any, salaryId: number) {
  const details = await tx.pR_Monthly_Salary_Details.findMany({ where: { Salary_ID: salaryId } });
  const earnings = details.filter((d: any) => d.Detail_Type === "Earning" || d.Detail_Type === "Bonus");
  const deductions = details.filter((d: any) => d.Detail_Type === "Deduction");
  const gross = earnings.reduce((s: number, d: any) => s + toNum(d.Amount), 0);
  const ded = deductions.reduce((s: number, d: any) => s + toNum(d.Amount), 0);
  const allowances = earnings.filter((d: any) => isAllowanceDesc(d.Description)).reduce((s: number, d: any) => s + toNum(d.Amount), 0);
  await tx.pR_Monthly_Salary.update({
    where: { Salary_ID: salaryId },
    data: { Gross_Salary: rial(gross), Total_Deductions: rial(ded), Total_Allowances: rial(allowances), Net_Salary: rial(gross - ded) },
  });
  return { gross, ded, net: gross - ded };
}

// ============================================================
//  ۱) تولید فیش‌های ماه — وقتی ماه تمام شد اجرا می‌شود
//  فقط فیش‌های جدید ساخته می‌شود؛ فیش موجود دست‌نخورده می‌ماند
// ============================================================
export async function generateMonthlyPayslipsAction(year: number, month: number) {
  const guard = await requirePayrollAccess();
  if (!guard.user) return { error: guard.error };
  if (!year || !month || month < 1 || month > 12) return { error: "سال/ماه نامعتبر است" };

  try {
    // تعطیلات رسمی ماه
    const holidays = await prisma.pR_Holidays.findMany();
    const holidaySet = new Set(
      holidays
        .map(h => new Date(h.Date))
        .filter(d => getYear(d) === year && getMonth(d) === month - 1)
        .map(d => d.toDateString())
    );

    // پرسنل فعال (به‌جز مدیرعامل) با پارامتر مالی فعال
    const personnelList = await prisma.personnel.findMany({
      where: { IsActive: true, Role: { not: "CEO" } },
      include: {
        PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel: {
          where: { Is_Active: true },
          orderBy: { Effective_From: "desc" },
          take: 1,
        },
      },
    });

    const ids = personnelList.map(p => p.Personnel_ID);

    // کارکرد تاییدشده همه پرسنل در این ماه شمسی
    const reports = ids.length
      ? await prisma.pR_Daily_Reports.findMany({
          where: { Personnel_ID: { in: ids }, Report_Status: { in: ["Manager_Reviewed", "Finance_Processed"] } },
          select: { Personnel_ID: true, Report_Date: true, Work_Hours: true, Manager_Score: true },
        })
      : [];

    const reportsByPerson = new Map<number, any[]>();
    for (const r of reports) {
      const d = new Date(r.Report_Date);
      if (getYear(d) !== year || getMonth(d) !== month - 1) continue;
      const arr = reportsByPerson.get(r.Personnel_ID) || [];
      arr.push(r);
      reportsByPerson.set(r.Personnel_ID, arr);
    }

    // فیش‌های موجود این ماه — دست نمی‌خورند
    const existing = await prisma.pR_Monthly_Salary.findMany({
      where: { Salary_Year: year, Salary_Month: month },
      select: { Personnel_ID: true },
    });
    const existingIds = new Set(existing.map(e => e.Personnel_ID));

    let created = 0;
    const skippedExisting: string[] = [];
    const skipped: { name: string; reason: string }[] = [];

    for (const p of personnelList) {
      if (existingIds.has(p.Personnel_ID)) { skippedExisting.push(p.Full_Name); continue; }

      const fin: any = (p as any).PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel?.[0];
      if (!fin || toNum(fin.Base_Monthly_Salary) <= 0) {
        skipped.push({ name: p.Full_Name, reason: "پارامترهای مالی ثبت نشده است" });
        continue;
      }

      const buckets = bucketizeReports(reportsByPerson.get(p.Personnel_ID) || [], holidaySet);
      const rows = buildEngineRows(fin, buckets);

      const gross = rows.filter(r => r.Detail_Type === "Earning").reduce((s, r) => s + r.Amount, 0);
      const child = toNum(fin.Child_Allowance);
      const insurance = Math.max(0, (gross - child) * (INSURANCE_EMPLOYEE_PERCENT / 100));
      const fullRows = [...rows, { Detail_Type: "Deduction" as const, Amount: rial(insurance), Description: `بیمه سهم کارمند (${INSURANCE_EMPLOYEE_PERCENT}٪)` }];

      const ded = fullRows.filter(r => r.Detail_Type === "Deduction").reduce((s, r) => s + r.Amount, 0);
      const allowances = rows.filter(r => isAllowanceDesc(r.Description)).reduce((s, r) => s + r.Amount, 0);

      await prisma.$transaction(async (tx: any) => {
        const salary = await tx.pR_Monthly_Salary.create({
          data: {
            Personnel_ID: p.Personnel_ID,
            Salary_Year: year,
            Salary_Month: month,
            Total_Work_Hours: buckets.regular,
            Total_Overtime_Hours: buckets.overtime,
            Total_OffHours_Hours: Math.round((buckets.friday + buckets.holiday) * 100) / 100,
            Gross_Salary: rial(gross),
            Total_Allowances: rial(allowances),
            Total_Deductions: rial(ded),
            Net_Salary: rial(gross - ded),
            Insurance_Employee: rial(insurance),
            Tax_Amount: 0, // مالیات فعلا دستی توسط حسابدار قابل ویرایش است
            Status: "Draft",
            Calculated_At: new Date(),
          },
        });
        await tx.pR_Monthly_Salary_Details.createMany({
          data: fullRows.map(r => ({
            Salary_ID: salary.Salary_ID,
            Detail_Type: r.Detail_Type,
            Amount: rial(r.Amount),
            Description: r.Description,
            Is_Manual: false,
          })),
        });
      });
      created++;
    }

    revalidatePath("/dashboard/payroll");
    return { success: true, created, skippedExisting, skipped, holidayCount: holidaySet.size };
  } catch (err: any) {
    console.error("generateMonthlyPayslipsAction:", err);
    return { error: `خطا در تولید فیش‌ها: ${err.message}` };
  }
}

// ============================================================
//  ۲) لیست فیش‌های یک ماه (برای حسابداری و مدیرعامل)
// ============================================================
export async function getPayrollMonthAction(year: number, month: number) {
  const guard = await requirePayrollAccess();
  if (!guard.user) return { error: guard.error };
  if (!year || !month || month < 1 || month > 12) return { error: "سال/ماه نامعتبر است" };

  try {
    const salaries = await prisma.pR_Monthly_Salary.findMany({
      where: { Salary_Year: year, Salary_Month: month },
      include: {
        // ⚠️ نام رابطه در اسکیمای شما همین بلند است (فیلد Personnel وجود ندارد)
        Personnel_PR_Monthly_Salary_Personnel_IDToPersonnel: { include: { OrganizationalPosition: true, Unit: true } },
        PR_Monthly_Salary_Details: { orderBy: { Detail_ID: "asc" } },
        Personnel_PR_Monthly_Salary_Accountant_IDToPersonnel: { select: { Full_Name: true } },
        Personnel_PR_Monthly_Salary_Approved_ByToPersonnel:   { select: { Full_Name: true } },
      },
      orderBy: { Salary_ID: "desc" },
    });

    // نگاشت رابطه بلند به کلید کوتاه Personnel برای کلاینت
    const mapped = (salaries as any[]).map((s: any) => ({
      ...s,
      Personnel: s.Personnel_PR_Monthly_Salary_Personnel_IDToPersonnel ?? null,
    }));

    return JSON.parse(JSON.stringify(mapped));
  } catch (err: any) {
    return { error: `خطا در دریافت فیش‌ها: ${err.message}` };
  }
}

// یافتن فیش با بررسی وضعیت و برگرداندن آن (کمک‌تابع داخلی)
async function getSalaryWithGuard(salaryId: number, allowedStatuses: string[]) {
  const salary = await prisma.pR_Monthly_Salary.findUnique({
    where: { Salary_ID: salaryId },
    include: { PR_Monthly_Salary_Details: true },
  });
  if (!salary) return { error: "فیش حقوقی یافت نشد" };
  if (!allowedStatuses.includes(String(salary.Status))) {
    return { error: `این عملیات برای وضعیت فعلی فیش (${salary.Status}) مجاز نیست` };
  }
  return { salary };
}

// ============================================================
//  ۳) ذخیره ویرایش‌های حسابدار روی اعداد فیش
//  فقط در وضعیت Draft / Rejected — هر عدد قابل تغییر است
// ============================================================
export async function updatePayslipItemsAction(
  salaryId: number,
  items: { Detail_ID: number; Amount: number }[]
) {
  const guard = await requirePayrollAccess();
  if (!guard.user) return { error: guard.error };

  try {
    const g = await getSalaryWithGuard(salaryId, ["Draft", "Rejected"]);
    if (g.error) return { error: g.error };

    await prisma.$transaction(async (tx: any) => {
      for (const item of items || []) {
        const detail = g.salary!.PR_Monthly_Salary_Details.find((d: any) => d.Detail_ID === item.Detail_ID);
        if (!detail) continue;
        const newAmount = rial(item.Amount);
        if (newAmount < 0 || toNum(detail.Amount) === newAmount) continue;
        await tx.pR_Monthly_Salary_Details.update({
          where: { Detail_ID: detail.Detail_ID },
          data: {
            Amount: newAmount,
            // مقدار اولیه فقط بار اول ویرایش ثبت می‌شود
            Original_Amount: detail.Is_Manual ? detail.Original_Amount : detail.Amount,
            Is_Manual: true,
          },
        });
      }
      await recalcTotals(tx, salaryId);
    });

    revalidatePath("/dashboard/payroll");
    return { success: true };
  } catch (err: any) {
    return { error: `خطا در ذخیره ویرایش‌ها: ${err.message}` };
  }
}

// ============================================================
//  ۴) تایید حسابدار → ارسال به مدیرعامل
// ============================================================
export async function accountantApproveAction(salaryId: number) {
  const guard = await requirePayrollAccess();
  if (!guard.user) return { error: guard.error };

  try {
    const g = await getSalaryWithGuard(salaryId, ["Draft", "Rejected"]);
    if (g.error) return { error: g.error };

    await prisma.pR_Monthly_Salary.update({
      where: { Salary_ID: salaryId },
      data: {
        Status: "Pending_CEO",
        Accountant_ID: guard.user.Personnel_ID,
        Accountant_At: new Date(),
        Reject_Reason: null,
      },
    });

    revalidatePath("/dashboard/payroll");
    revalidatePath("/dashboard/payroll-approval");
    return { success: true };
  } catch (err: any) {
    return { error: `خطا در تایید: ${err.message}` };
  }
}

// ============================================================
//  ۵) تایید نهایی مدیرعامل → فیش برای کارمند قابل مشاهده می‌شود
// ============================================================
export async function ceoApproveAction(salaryId: number) {
  const guard = await requireCEO();
  if (!guard.user) return { error: guard.error };

  try {
    const g = await getSalaryWithGuard(salaryId, ["Pending_CEO"]);
    if (g.error) return { error: g.error };

    await prisma.pR_Monthly_Salary.update({
      where: { Salary_ID: salaryId },
      data: { Status: "Approved", Approved_By: guard.user.Personnel_ID, Approved_At: new Date() },
    });

    revalidatePath("/dashboard/payroll-approval");
    revalidatePath("/dashboard/payslips");
    return { success: true };
  } catch (err: any) {
    return { error: `خطا در تایید نهایی: ${err.message}` };
  }
}

// ============================================================
//  ۶) رد توسط مدیرعامل → برگشت به حسابدار با دلیل
// ============================================================
export async function ceoRejectAction(salaryId: number, reason: string) {
  const guard = await requireCEO();
  if (!guard.user) return { error: guard.error };
  const cleanReason = String(reason || "").trim();
  if (!cleanReason) return { error: "ثبت دلیل رد الزامی است" };

  try {
    const g = await getSalaryWithGuard(salaryId, ["Pending_CEO"]);
    if (g.error) return { error: g.error };

    await prisma.pR_Monthly_Salary.update({
      where: { Salary_ID: salaryId },
      data: { Status: "Rejected", Reject_Reason: cleanReason.slice(0, 500) },
    });

    revalidatePath("/dashboard/payroll-approval");
    revalidatePath("/dashboard/payroll");
    return { success: true };
  } catch (err: any) {
    return { error: `خطا در رد فیش: ${err.message}` };
  }
}

// ============================================================
//  ۷) ثبت جریمه توسط مدیرعامل (مبلغ + دلیل → کسر از حقوق)
// ============================================================
export async function addPenaltyAction(salaryId: number, amount: number, reason: string) {
  const guard = await requireCEO();
  if (!guard.user) return { error: guard.error };

  const cleanReason = String(reason || "").trim();
  const amt = rial(amount);
  if (!cleanReason) return { error: "ثبت دلیل جریمه الزامی است" };
  if (amt <= 0) return { error: "مبلغ جریمه باید بزرگ‌تر از صفر باشد" };

  try {
    const g = await getSalaryWithGuard(salaryId, ["Pending_CEO"]);
    if (g.error) return { error: g.error };

    let penaltyType = await prisma.pR_Deduction_Types.findUnique({ where: { Deduction_Code: PENALTY_DEDUCTION_CODE } });
    if (!penaltyType) {
      penaltyType = await prisma.pR_Deduction_Types.create({
        data: { Deduction_Code: PENALTY_DEDUCTION_CODE, Deduction_Name: "جریمه مدیرعامل", Is_Active: true },
      });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.pR_Monthly_Salary_Details.create({
        data: {
          Salary_ID: salaryId,
          Detail_Type: "Deduction",
          Deduction_Type_ID: penaltyType!.Deduction_Type_ID,
          Amount: amt,
          Description: `جریمه: ${cleanReason.slice(0, 220)}`,
          Is_Manual: true,
        },
      });
      await recalcTotals(tx, salaryId);
    });

    revalidatePath("/dashboard/payroll-approval");
    return { success: true };
  } catch (err: any) {
    return { error: `خطا در ثبت جریمه: ${err.message}` };
  }
}

// ============================================================
//  ۸) حذف جریمه (فقط توسط مدیرعامل، قبل از تایید نهایی)
// ============================================================
export async function removePenaltyAction(detailId: number) {
  const guard = await requireCEO();
  if (!guard.user) return { error: guard.error };

  try {
    const detail = await prisma.pR_Monthly_Salary_Details.findUnique({
      where: { Detail_ID: detailId },
      include: { PR_Deduction_Types: true, PR_Monthly_Salary: { select: { Salary_ID: true, Status: true } } },
    });
    if (!detail) return { error: "قلم یافت نشد" };
    if (detail.PR_Deduction_Types?.Deduction_Code !== PENALTY_DEDUCTION_CODE) {
      return { error: "این قلم جریمه نیست" };
    }
    if (!["Draft", "Pending_CEO", "Rejected"].includes(String(detail.PR_Monthly_Salary.Status))) {
      return { error: "بعد از تایید نهایی امکان حذف جریمه نیست" };
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.pR_Monthly_Salary_Details.delete({ where: { Detail_ID: detailId } });
      await recalcTotals(tx, detail.Salary_ID);
    });

    revalidatePath("/dashboard/payroll-approval");
    return { success: true };
  } catch (err: any) {
    return { error: `خطا در حذف جریمه: ${err.message}` };
  }
}

// ============================================================
//  ۹) بازمحاسبه یک فیش از روی کارکرد فعلی
//  - فقط در وضعیت Draft / Rejected
//  - ردیف‌های دستی (Is_Manual) با همان عنوان حفظ می‌شوند
// ============================================================
export async function recalculatePayslipAction(salaryId: number) {
  const guard = await requirePayrollAccess();
  if (!guard.user) return { error: guard.error };

  try {
    const g = await getSalaryWithGuard(salaryId, ["Draft", "Rejected"]);
    if (g.error) return { error: g.error };
    const salary: any = g.salary;

    const personnel = await prisma.personnel.findUnique({
      where: { Personnel_ID: salary.Personnel_ID },
      include: {
        PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel: {
          where: { Is_Active: true },
          orderBy: { Effective_From: "desc" },
          take: 1,
        },
      },
    });
    const fin: any = personnel?.PR_Personnel_Finance_PR_Personnel_Finance_Personnel_IDToPersonnel?.[0];
    if (!fin || toNum(fin.Base_Monthly_Salary) <= 0) {
      return { error: "پارامترهای مالی فعال برای این پرسنل یافت نشد" };
    }

    const holidays = await prisma.pR_Holidays.findMany();
    const holidaySet = new Set(
      holidays
        .map(h => new Date(h.Date))
        .filter(d => getYear(d) === salary.Salary_Year && getMonth(d) === salary.Salary_Month - 1)
        .map(d => d.toDateString())
    );

    const reports = await prisma.pR_Daily_Reports.findMany({
      where: { Personnel_ID: salary.Personnel_ID, Report_Status: { in: ["Manager_Reviewed", "Finance_Processed"] } },
      select: { Report_Date: true, Work_Hours: true, Manager_Score: true },
    });
    const monthReports = reports.filter((r: any) => {
      const d = new Date(r.Report_Date);
      return getYear(d) === salary.Salary_Year && getMonth(d) === salary.Salary_Month - 1;
    });

    const buckets = bucketizeReports(monthReports, holidaySet);
    const rows = buildEngineRows(fin, buckets);
    const gross = rows.filter(r => r.Detail_Type === "Earning").reduce((s, r) => s + r.Amount, 0);
    const child = toNum(fin.Child_Allowance);
    const insurance = Math.max(0, (gross - child) * (INSURANCE_EMPLOYEE_PERCENT / 100));
    const freshRows: EngineRow[] = [...rows, { Detail_Type: "Deduction", Amount: rial(insurance), Description: `بیمه سهم کارمند (${INSURANCE_EMPLOYEE_PERCENT}٪)` }];

    await prisma.$transaction(async (tx: any) => {
      const all = await tx.pR_Monthly_Salary_Details.findMany({ where: { Salary_ID: salaryId } });
      const manualDescs = new Set(all.filter((d: any) => d.Is_Manual).map((d: any) => String(d.Description)));

      // حذف ردیف‌های غیردستی و بازسازی آن‌ها
      for (const d of all) {
        if (!d.Is_Manual) await tx.pR_Monthly_Salary_Details.delete({ where: { Detail_ID: d.Detail_ID } });
      }
      const toCreate = freshRows.filter(r => !manualDescs.has(r.Description));
      if (toCreate.length) {
        await tx.pR_Monthly_Salary_Details.createMany({
          data: toCreate.map(r => ({ Salary_ID: salaryId, Detail_Type: r.Detail_Type, Amount: rial(r.Amount), Description: r.Description, Is_Manual: false })),
        });
      }

      await tx.pR_Monthly_Salary.update({
        where: { Salary_ID: salaryId },
        data: {
          Total_Work_Hours: buckets.regular,
          Total_Overtime_Hours: buckets.overtime,
          Total_OffHours_Hours: Math.round((buckets.friday + buckets.holiday) * 100) / 100,
          Calculated_At: new Date(),
        },
      });
      await recalcTotals(tx, salaryId);
    });

    revalidatePath("/dashboard/payroll");
    return { success: true };
  } catch (err: any) {
    return { error: `خطا در بازمحاسبه: ${err.message}` };
  }
}

// ============================================================
//  ۱۰) فیش‌های من (کارمند) — فقط تاییدشده نهایی و پرداخت‌شده
// ============================================================
export async function getMyPayslipsAction() {
  const user = await getCurrentUser();
  if (!user?.Personnel || user.Personnel_ID == null) return { error: "نشست نامعتبر است" };

  try {
    const personnelId = Number(user.Personnel_ID);
    const salaries = await prisma.pR_Monthly_Salary.findMany({
      where: { Personnel_ID: personnelId, Status: { in: ["Approved", "Paid"] } },
      include: { PR_Monthly_Salary_Details: { orderBy: [{ Detail_Type: "asc" }, { Detail_ID: "asc" }] } },
      orderBy: [{ Salary_Year: "desc" }, { Salary_Month: "desc" }],
    });
    return JSON.parse(JSON.stringify(salaries));
  } catch (err: any) {
    return { error: `خطا در دریافت فیش‌ها: ${err.message}` };
  }
}