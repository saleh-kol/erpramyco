// ============================================================
//  ثابت‌ها و توابع مشترک ماژول ابلاغیه‌ها (PR_Tasks)
// ============================================================

// ---------- وضعیت‌های دیتابیس (PR_Tasks.Status) ----------
export const TASK_STATUS = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

// ---------- اولویت ----------
export const TASK_PRIORITY_LABELS: Record<string, string> = {
  Low: "کم",
  Normal: "معمولی",
  High: "زیاد",
  Urgent: "فوری",
};

export function translatePriority(priority?: string | null): string {
  if (!priority) return "-";
  return TASK_PRIORITY_LABELS[priority] || priority;
}

// ---------- تب‌ها ----------
// ceoOnly: تب «در انتظار تایید» در نمای مدیر فقط برای مدیرعامل نمایش داده می‌شود
// (نمای کارمند همه تب‌ها را می‌بیند)
export interface TaskTabConfig {
  key: TaskStatus;
  label: string;
  reviewerOnly: boolean;
}

export const TASK_TABS: TaskTabConfig[] = [
  { key: "Pending",   label: "در حال انجام",    reviewerOnly: false },
  { key: "Submitted", label: "در انتظار تایید", reviewerOnly: true },
  { key: "Approved",  label: "تایید شده",       reviewerOnly: false },
];

// ✅ تایپ صریح string[] تا includes(string) خطای TS نگیرد (درس از باگ قبلی)
export const TASK_VALID_STATUSES: string[] = TASK_TABS.map((t) => t.key);

// ---------- نشان وضعیت ----------
export interface TaskBadgeConfig {
  bg: string;
  color: string;
  text: string;
}

export function getTaskBadge(status?: string | null): TaskBadgeConfig {
  if (status === TASK_STATUS.APPROVED)
    return { bg: "#dcfce7", color: "#166534", text: "تایید شده" };
  if (status === TASK_STATUS.SUBMITTED)
    return { bg: "#eff6ff", color: "#1d4ed8", text: "در انتظار تایید" };
  return { bg: "#ffedd5", color: "#c2410c", text: "در حال انجام" };
}

// ---------- توابع فرمت (هماهنگ با ماژول ماموریت‌ها) ----------
export function toPersianDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fa-IR");
}

export function formatToLocalISO(dateObj: unknown): string {
  if (!dateObj) return "";
  try {
    const date =
      dateObj instanceof Date
        ? dateObj
        : (dateObj as any).toDate
          ? (dateObj as any).toDate()
          : new Date(dateObj as any);
    if (isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}