// ============================================================
//  ثابت‌ها و توابع مشترک ماژول ماموریت‌ها
// ============================================================

// ---------- وضعیت‌های دیتابیس (PR_Commute_Logs.Status) ----------
export const MISSION_STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "InProgress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
} as const;

export type MissionStatus = (typeof MISSION_STATUS)[keyof typeof MISSION_STATUS];

// ---------- گزینه‌های ارزیابی مدیر ----------
export const REVIEW_ACTIONS = {
  APPROVED: "Approved",
  NEEDS_REVISION: "NeedsRevision",
  REJECTED: "Rejected",
} as const;

// ---------- تنظیمات تب‌ها (فیلترها) ----------
export interface TabConfig {
  key: string;
  label: string;
  activeColor: string;
}

// نمای کارمند
export const MY_MISSION_TABS: TabConfig[] = [
  { key: "pending",    label: "در انتظار تایید", activeColor: "#ed6e2b" },
  { key: "inprogress", label: "در حال انجام",    activeColor: "#3b82f6" },
  { key: "completed",  label: "انجام شده",       activeColor: "#16a34a" },
  { key: "rejected",   label: "رد شده",          activeColor: "#ef4444" },
];

// ✅ اصلاح ۱: نمای مدیر — برچسب‌ها و رنگ‌ها دقیقاً مطابق UI فعلی خودت
export const MANAGER_MISSION_TABS: TabConfig[] = [
  { key: "pending",    label: "در انتظار تایید", activeColor: "#ed6e2b" },
  { key: "inprogress", label: "در حال انجام",    activeColor: "#3b82f6" },
  { key: "completed",  label: "انجام شده",       activeColor: "#f59e0b" },
  { key: "approved",   label: "تایید شده",       activeColor: "#16a34a" },
  { key: "rejected",   label: "رد شده",          activeColor: "#ef4444" },
];

export const MY_MISSION_VALID_STATUSES = MY_MISSION_TABS.map((t) => t.key);
export const MANAGER_MISSION_VALID_STATUSES = MANAGER_MISSION_TABS.map((t) => t.key);

// نگاشت تب کارمند → وضعیت دیتابیس
export const MY_STATUS_MAP: Record<string, MissionStatus> = {
  pending:    MISSION_STATUS.PENDING,
  inprogress: MISSION_STATUS.IN_PROGRESS,
  completed:  MISSION_STATUS.COMPLETED,
  rejected:   MISSION_STATUS.REJECTED,
};

// ---------- نوع وسیله نقلیه ----------
export const COMMUTE_TYPE_LABELS: Record<string, string> = {
  CompanyVehicle:  "وسیله نقلیه شرکت",
  PersonalVehicle: "وسیله نقلیه شخصی",
  PublicTransport: "حمل و نقل عمومی",
  Taxi:            "تاکسی",
  Other:           "سایر",
};

export const COMMUTE_TYPE_OPTIONS = [
  { value: "PersonalVehicle", label: "وسیله نقلیه شخصی" },
  { value: "CompanyVehicle",  label: "وسیله نقلیه شرکت" },
  { value: "PublicTransport", label: "حمل و نقل عمومی" },
  { value: "Taxi",            label: "تاکسی" },
];

// ✅ اصلاح ۲: فرم مدیر گزینه «سایر» هم دارد (فرم کارمند ندارد — رفتار قبلی)
export const COMMUTE_TYPE_OPTIONS_MANAGER = [
  ...COMMUTE_TYPE_OPTIONS,
  { value: "Other", label: "سایر" },
];

// ============================================================
//  توابع کمکی مشترک
// ============================================================

export function toPersianDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fa-IR");
}

export function formatAmount(amount: unknown): string {
  return Number(amount || 0).toLocaleString("fa-IR");
}

export function translateCommuteType(type?: string | null): string {
  if (!type) return "-";
  return COMMUTE_TYPE_LABELS[type] || type;
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

// ---------- نشان وضعیت (Badge) ----------
export interface BadgeConfig {
  bg: string;
  color: string;
  text: string;
  icon: "check" | "clock" | "x" | "alert";
}

/**
 * managerView=true  → رفتار مدیر (Completed بدون تایید = «در انتظار ارزیابی»)
 * managerView=false → رفتار کارمند (دقیقاً مثل قبل)
 */
export function getMissionBadge(
  mission: { Status?: string | null; Is_Approved?: boolean | null },
  managerView = false
): BadgeConfig {
  const s = mission.Status;
  if (s === MISSION_STATUS.COMPLETED) {
    if (mission.Is_Approved)
      return { bg: "#f0fdf4", color: "#166534", text: managerView ? "تایید نهایی شده" : "انجام شده", icon: "check" };
    return managerView
      ? { bg: "#f5f3ff", color: "#6d28d9", text: "در انتظار ارزیابی مدیر", icon: "clock" }
      : { bg: "#f0fdf4", color: "#166534", text: "انجام شده", icon: "check" };
  }
  if (s === MISSION_STATUS.IN_PROGRESS)
    return { bg: "#eff6ff", color: "#1d4ed8", text: "در حال انجام", icon: "clock" };
  if (s === MISSION_STATUS.REJECTED)
    return { bg: "#fef2f2", color: "#991b1b", text: "رد شده", icon: "x" };
  return { bg: "#fff7ed", color: "#c2410c", text: "در انتظار تایید سرپرست", icon: "alert" };
}

// ---------- پیوست ماموریت ----------
export const MISSION_ATTACHMENT = {
  MAX_SIZE_BYTES: 1024 * 1024, // ۱ مگابایت
  MAX_SIZE_LABEL: "۱ مگابایت",
  ALLOWED_EXTENSIONS: ["png", "jpg", "jpeg", "xls", "xlsx", "doc", "docx"] as readonly string[],
  ACCEPT_ATTR: ".png,.jpg,.jpeg,.xls,.xlsx,.doc,.docx",
  ALLOWED_LABEL: "PNG و JPG، Excel (xls/xlsx)، Word (doc/docx)",
} as const;

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return "0 بایت";
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} مگابایت`;
}

export function getAttachmentIconType(fileName: string): "image" | "excel" | "word" | "file" {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg"].includes(ext)) return "image";
  if (["xls", "xlsx"].includes(ext)) return "excel";
  if (["doc", "docx"].includes(ext)) return "word";
  return "file";
}