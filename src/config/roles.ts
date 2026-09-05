// src/lib/roles.ts

// نقش‌های موجود در دیتابیس
export const ROLES = {
  SUPERVISOR: 'سرپرست',
  FACTORY_MANAGER: 'مدیر کارخانه',
  MAINTENANCE_MANAGER: 'مدیر نت',
  TECHNICIAN: 'تعمیرکار',
  OPERATOR: 'اپراتور',
  COMMERCE: 'واحد مالی',
  CONTRACTOR: 'پیمانکار',
} as const

// دسترسی‌های مجاز برای هر نقش
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  // مدیر کارخانه (مدیرعامل) به همه چیز دسترسی دارد
  [ROLES.FACTORY_MANAGER]: [
    '/dashboard',
    '/dashboard/projects',
    '/dashboard/missions',
    '/dashboard/personnel',
    '/dashboard/payroll',
    '/dashboard/daily-reports',
    '/dashboard/machines',
    '/dashboard/workorders',
    '/dashboard/spare-parts',
    '/dashboard/settings',
    '/dashboard/leave-approvals',
    '/dashboard/tasks',
    '/dashboard/hours-settings',
    '/dashboard/activity-settings'
  ],

  // واحد مالی فقط به بخش‌های مالی و پرسنل دسترسی دارد
  [ROLES.COMMERCE]: [
    '/dashboard',
    '/dashboard/payroll',
    '/dashboard/daily-reports',
    '/dashboard/personnel',
    '/dashboard/calendar', // فقط برای واحد مالی
    '/dashboard/my-tasks',
    '/dashboard/payroll-settings'
  ],

  // مدیر نت به بخش‌های تعمیرات و ماشین‌آلات دسترسی دارد
  [ROLES.MAINTENANCE_MANAGER]: [
    '/dashboard',
    '/dashboard/machines',
    '/dashboard/workorders',
    '/dashboard/spare-parts',
    '/dashboard/daily-reports',
    '/dashboard/personnel',
    '/dashboard/attendance',
    '/dashboard/leave',
    '/dashboard/my-tasks',
    '/dashboard/my-projects',
    '/dashboard/my-missions',
    '/dashboard/my-work-hours'
  ],

  // سرپرست تولید
  [ROLES.SUPERVISOR]: [
    '/dashboard',
    '/dashboard/machines',
    '/dashboard/workorders',
    '/dashboard/daily-reports',
    '/dashboard/attendance',
    '/dashboard/leave',
    '/dashboard/my-tasks',
    '/dashboard/my-projects',
    '/dashboard/my-missions',
    '/dashboard/my-work-hours'
  ],

  // تعمیرکار
  [ROLES.TECHNICIAN]: [
    '/dashboard',
    '/dashboard/workorders',
    '/dashboard/spare-parts',
    '/dashboard/daily-reports',
    '/dashboard/attendance',
    '/dashboard/leave',
    '/dashboard/my-tasks',
    '/dashboard/my-projects',
    '/dashboard/my-missions',
    '/dashboard/my-work-hours'
  ],

  // اپراتور
  [ROLES.OPERATOR]: [
    '/dashboard',
    '/dashboard/workorders',
    '/dashboard/daily-reports',
    '/dashboard/attendance',
    '/dashboard/leave',
    '/dashboard/my-tasks',
    '/dashboard/my-projects',
    '/dashboard/my-missions',
    '/dashboard/my-work-hours'
  ],

  // پیمانکار
  [ROLES.CONTRACTOR]: [
    '/dashboard',
    '/dashboard/workorders',
    '/dashboard/attendance',
    '/dashboard/leave',
    '/dashboard/my-tasks',
    '/dashboard/my-projects',
    '/dashboard/my-missions',
    '/dashboard/my-work-hours'
  ],
}