"use client";

import { useState, useEffect } from "react";
import { addHolidayAction, deleteHolidayAction } from "@/actions/calendar";
import { Calendar, Plus, Trash2, CheckCircle, Info } from "lucide-react";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const toPersianDate = (date: Date | string) => {
  if (!date) return "-";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("fa-IR");
};

const formatToLocalISO = (dateObj: any) => {
  if (!dateObj) return "";

  try {
    const date =
      dateObj instanceof Date
        ? dateObj
        : dateObj.toDate
          ? dateObj.toDate()
          : new Date(dateObj);

    if (isNaN(date.getTime())) return "";

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
};

export default function CalendarClient({
  holidays,
}: {
  holidays: any[];
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [dateVal, setDateVal] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showToast = (message: string) => {
    setToast(message);

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const dateStr = formatToLocalISO(dateVal);

    if (!dateStr) {
      showToast("لطفاً یک تاریخ انتخاب کنید");
      return;
    }

    formData.append("date", dateStr);

    try {
      await addHolidayAction(formData);

      setDateVal(null);
      showToast("روز تعطیل با موفقیت ثبت شد");
    } catch {
      showToast("ثبت روز تعطیل با خطا مواجه شد");
    }
  };

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    try {
      await deleteHolidayAction(formData);
      showToast("روز تعطیل حذف شد");
    } catch {
      showToast("حذف روز تعطیل با خطا مواجه شد");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">

        {/* فرم ثبت تعطیلی */}
        <div className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                <Calendar className="h-5 w-5 text-[#ed6e2b]" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  تعریف روز تعطیل
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  ثبت تعطیلات و مناسبت‌های سازمان
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleAdd}
            className="space-y-5 p-5 md:p-6"
          >
            {/* تاریخ */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                تاریخ <span className="text-red-500">*</span>
              </label>

              <div className="calendar-picker-wrapper">
                {isMounted ? (
                  <DatePicker
                    value={dateVal}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    onChange={setDateVal}
                    format="YYYY/MM/DD"
                    containerClassName="w-full"
                    inputClass="w-full"
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      outline: "none",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      backgroundColor: "#f8fafc",
                      boxSizing: "border-box",
                      textAlign: "right",
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    disabled
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
                  />
                )}
              </div>
            </div>

            {/* توضیحات */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                توضیحات
                <span className="mr-1 font-normal text-slate-400">
                  (مناسبت)
                </span>
              </label>

              <input
                name="description"
                type="text"
                placeholder="مثال: عید نوروز"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#ed6e2b] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>

            {/* دکمه ثبت */}
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ed6e2b] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#d95f20] active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              ثبت تعطیلی
            </button>
          </form>

          {/* نکته */}
          <div className="mx-5 mb-5 rounded-xl border border-orange-100 bg-orange-50/60 p-4 md:mx-6 md:mb-6">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#ed6e2b]" />

              <div>
                <p className="text-xs font-bold text-[#c6531c]">
                  نکته
                </p>

                <p className="mt-1.5 text-xs leading-6 text-slate-600">
                  روزهای جمعه به صورت خودکار در سیستم تعطیل محسوب
                  می‌شوند و نیازی به ثبت آن‌ها در این بخش نیست.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* لیست تعطیلات */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 md:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                لیست روزهای تعطیل
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                تعطیلات ثبت‌شده در تقویم سازمان
              </p>
            </div>

            <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-orange-50 px-3">
              <span className="text-sm font-bold text-[#ed6e2b]">
                {holidays.length}
              </span>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 text-right">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">
                    تاریخ
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-slate-500">
                    توضیحات
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-slate-500">
                    عملیات
                  </th>
                </tr>
              </thead>

              <tbody>
                {holidays.map((h: any) => (
                  <tr
                    key={h.Holiday_ID}
                    className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {toPersianDate(h.Date)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {h.Description || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <form onSubmit={handleDelete}>
                        <input
                          type="hidden"
                          name="id"
                          value={h.Holiday_ID}
                        />

                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          حذف
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}

                {holidays.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                          <Calendar className="h-6 w-6 text-slate-400" />
                        </div>

                        <p className="text-sm font-semibold text-slate-600">
                          هیچ روز تعطیلی ثبت نشده است
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          تعطیلات ثبت‌شده در این قسمت نمایش داده می‌شوند.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {holidays.map((h: any) => (
              <div
                key={h.Holiday_ID}
                className="p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-400">
                      تاریخ تعطیلی
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {toPersianDate(h.Date)}
                    </p>
                  </div>

                  <form onSubmit={handleDelete}>
                    <input
                      type="hidden"
                      name="id"
                      value={h.Holiday_ID}
                    />

                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      حذف
                    </button>
                  </form>
                </div>

                <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] font-semibold text-slate-400">
                    توضیحات
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {h.Description || "-"}
                  </p>
                </div>
              </div>
            ))}

            {holidays.length === 0 && (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                  <Calendar className="h-6 w-6 text-slate-400" />
                </div>

                <p className="text-sm font-semibold text-slate-600">
                  هیچ روز تعطیلی ثبت نشده است
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  تعطیلات ثبت‌شده در این قسمت نمایش داده می‌شوند.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
