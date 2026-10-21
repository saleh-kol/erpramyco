// ============================================================
//  بازه‌های زمانی هفتگی بر پایه ماه شمسی
//  ساختار: هفته۱ (۱-۷) | هفته۲ (۸-۱۴) | هفته۳ (۱۵-۲۱) | هفته۴ (۲۲-۲۸) | اواخر ماه (۲۹-پایان)
//  ⚠️ اگر تقسیم‌بندی شرکت شما فرق دارد، فقط همین جدول را عوض کن
// ============================================================

export const PERIOD_KEYS = ["week1", "week2", "week3", "week4", "monthEnd", "friday", "holiday"] as const;
export type PeriodKey = (typeof PERIOD_KEYS)[number];

export const PERIOD_RANGES: Record<string, { startDay: number; endDay: number; label: string }> = {
  week1:    { startDay: 1,  endDay: 7,   label: "هفته اول" },
  week2:    { startDay: 8,  endDay: 14,  label: "هفته دوم" },
  week3:    { startDay: 15, endDay: 21,  label: "هفته سوم" },
  week4:    { startDay: 22, endDay: 28,  label: "هفته چهارم" },
  monthend: { startDay: 29, endDay: 999, label: "اواخر ماه" },
  month:    { startDay: 1,  endDay: 999, label: "کل ماه" },
};

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

/** اجزای تاریخ شمسی (با ارقام لاتین برای پارس عددی) */
function getPersianParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-u-ca-persian", {
    year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(date);
  const num = (t: string) => Number((parts.find((p) => p.type === t)?.value || "").replace(/[^0-9]/g, ""));
  return { year: num("year"), month: num("month"), day: num("day") };
}

export interface PeriodRange {
  start: Date; // نیمه‌شب اولین روز بازه (لوکال)
  end: Date;   // ۲۳:۵۹:۵۹ آخرین روز بازه
  label: string; // مثلا «هفته دوم مرداد ۱۴۰۴»
  persianYear: number;
  persianMonth: number;
}

export function resolvePeriodRange(period: string, reference: Date = new Date()): PeriodRange {
  // ✅ tایپ آزاد — درس از خطای includes قبلی
  const key = (PERIOD_KEYS as readonly string[]).includes(period) ? period : "week1";
  const cfg = PERIOD_RANGES[key];

  const p = getPersianParts(reference);
  const today = { y: reference.getFullYear(), m: reference.getMonth(), d: reference.getDate() };

  // میلادیِ روزِ اولِ ماهِ شمسیِ جاری (JS سرریز روز منفی را خودش هندل می‌کند)
  const firstDayOfMonth = new Date(today.y, today.m, today.d - (p.day - 1));

  // طول ماه شمسی (۲۹ تا ۳۱ روز) — پروب روز ۳۰ و ۳۱
  let monthLength = 30;
  for (let i = 29; i <= 31; i++) {
    const probe = new Date(firstDayOfMonth);
    probe.setDate(probe.getDate() + i);
    if (getPersianParts(probe).month !== p.month) { monthLength = i; break; }
  }

  const startDay = Math.min(cfg.startDay, monthLength);
  const endDay = Math.min(cfg.endDay, monthLength);

  const start = new Date(firstDayOfMonth);
  start.setDate(start.getDate() + (startDay - 1));

  const end = new Date(firstDayOfMonth);
  end.setDate(end.getDate() + (endDay - 1));
  end.setHours(23, 59, 59, 999);

  return {
    start, end,
    label: `${cfg.label} ${PERSIAN_MONTHS[p.month - 1]} ${p.year}`,
    persianYear: p.year,
    persianMonth: p.month,
  };
}