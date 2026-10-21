import { getYear, getMonth } from "date-fns-jalali";
import PayrollClient from "./PayrollClient";

// صفحه فیش‌های حقوقی — بخش حسابداری
// دسترسی: مدیرعامل یا کاربری که مسیر /dashboard/payroll برایش باز است
export default async function PayrollPage() {
  const now = new Date();
  return <PayrollClient initialYear={getYear(now)} initialMonth={getMonth(now) + 1} />;
}