// ============================================================
//  منطق واحد پاداش پروژه — استفاده در سرور و کلاینت
// ============================================================

/**
 * نوع پذیرنده اعداد: عدد، رشته، یا Prisma.Decimal
 * Decimal از نظر ساختاری { toString(): string } را دارد، پس بدون
 * import کردن @prisma/client (که برای فایل‌های کلاینت سنگین است) پذیرفته می‌شود.
 * Number(decimal) در runtime هم درست تبدیل می‌کند.
 */
type NumericLike = number | string | { toString(): string } | null | undefined;

export interface ProjectDatesInput {
  Golden_Date?: Date | string | number | null;
  End_Date?: Date | string | number | null;
  Deadline_Date?: Date | string | number | null;
  Golden_Bonus_Percent?: NumericLike;
  Delay_Penalty_Percent?: NumericLike;
}

export type FactorKind = "golden" | "ontime" | "late" | "expired";

export interface TimeFactor {
  kind: FactorKind;
  percent: number; // مثبت = پاداش، منفی = جریمه
  reason: string;
}

export function getTimeFactor(project: ProjectDatesInput, delivery: Date): TimeFactor {
  const d = delivery.getTime();
  const golden = project.Golden_Date ? new Date(project.Golden_Date).getTime() : null;
  const end = project.End_Date ? new Date(project.End_Date).getTime() : null;
  const deadline = project.Deadline_Date ? new Date(project.Deadline_Date).getTime() : null;
  const gp = Number(project.Golden_Bonus_Percent || 0);
  const dp = Number(project.Delay_Penalty_Percent || 0);

  if (golden && d <= golden) return { kind: "golden", percent: gp, reason: `پاداش طلایی (+${gp}%)` };
  if (end && d <= end) return { kind: "ontime", percent: 0, reason: "تحویل به موقع" };
  if (deadline && d <= deadline) return { kind: "late", percent: -dp, reason: `جریمه دیرکرد (−${dp}%)` };
  return { kind: "expired", percent: -dp, reason: `گذشته از حد نهایی (−${dp}%)` };
}

/** پاداش نهایی یک عضو = دستمزد پایه × ضریب زمانی × ضریب مدیر */
export function calcMemberBonus(wage: NumericLike, factor: TimeFactor, managerScore: NumericLike): number {
  const w = Number(wage || 0);
  const score = Number(managerScore ?? 100) / 100;
  return Math.round(w * (1 + factor.percent / 100) * score);
}