"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLeaveRequestAction } from "@/actions/leave";
import {
  Search,
  Plus,
  Calendar,
  X,
  Save,
  CheckCircle,
  Clock,
  Check,
  XCircle,
  FileText,
} from "lucide-react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const toPersianDate = (date: Date | string) => {
  if (!date) return "-";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("fa-IR");
};

const translateLeaveStatus = (status: string) => {
  const statuses: Record<string, string> = {
    Pending: "در انتظار تأیید",
    Approved: "تأیید شده",
    Rejected: "رد شده",
    Cancelled: "لغو شده",
  };

  return statuses[status] || status;
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

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "Approved":
      return {
        label: "تأیید شده",
        className:
          "bg-emerald-50 text-emerald-700 border border-emerald-200",
        icon: Check,
      };

    case "Rejected":
      return {
        label: "رد شده",
        className: "bg-red-50 text-red-700 border border-red-200",
        icon: XCircle,
      };

    case "Cancelled":
      return {
        label: "لغو شده",
        className: "bg-slate-100 text-slate-600 border border-slate-200",
        icon: XCircle,
      };

    default:
      return {
        label: "در انتظار تأیید",
        className:
          "bg-orange-50 text-[#c6531c] border border-orange-200",
        icon: Clock,
      };
  }
};

export default function LeaveClient({
  types,
  requests,
  searchParams,
}: {
  types: any[];
  requests: any[];
  searchParams: any;
}) {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [filterStart, setFilterStart] = useState<any>(
    searchParams.start
      ? new Date(`${searchParams.start}T00:00:00`)
      : null
  );

  const [filterEnd, setFilterEnd] = useState<any>(
    searchParams.end
      ? new Date(`${searchParams.end}T00:00:00`)
      : null
  );

  const [formStart, setFormStart] = useState<any>(null);
  const [formEnd, setFormEnd] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showToast = (message: string) => {
    setToast(message);

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const applyDateFilter = () => {
    const params = new URLSearchParams();

    const start = formatToLocalISO(filterStart);
    const end = formatToLocalISO(filterEnd);

    if (start) {
      params.set("start", start);
    }

    if (end) {
      params.set("end", end);
    }

    const query = params.toString();

    router.push(
      query
        ? `/dashboard/leave?${query}`
        : "/dashboard/leave"
    );
  };

  const openModal = () => {
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError(null);
    setFormStart(null);
    setFormEnd(null);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setFormError(null);

    const formData = new FormData(e.currentTarget);

    const start = formatToLocalISO(formStart);
    const end = formatToLocalISO(formEnd);

    if (!start || !end) {
      setFormError("لطفاً تاریخ شروع و پایان مرخصی را انتخاب کنید.");
      return;
    }

    if (new Date(end) < new Date(start)) {
      setFormError(
        "تاریخ پایان مرخصی نمی‌تواند قبل از تاریخ شروع باشد."
      );
      return;
    }

    formData.append("startDate", start);
    formData.append("endDate", end);

    try {
      const result = await createLeaveRequestAction(formData);

      if (result?.error) {
        setFormError(result.error);
        return;
      }

      if (result?.success) {
        closeModal();
        showToast("درخواست مرخصی با موفقیت ثبت شد");
      }
    } catch {
      setFormError(
        "در ثبت درخواست مشکلی پیش آمد. لطفاً دوباره تلاش کنید."
      );
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#ed6e2b]">
                <Calendar className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  مدیریت مرخصی
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  مشاهده سوابق و ثبت درخواست مرخصی
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ed6e2b] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#d95f20] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-orange-100"
            >
              <Plus className="h-5 w-5" />
              ثبت درخواست مرخصی
            </button>
          </div>
        </section>

        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Search className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                فیلتر سوابق
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                بازه زمانی موردنظر خود را انتخاب کنید
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                از تاریخ
              </label>

              {isMounted ? (
                <DatePicker
                  value={filterStart}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  onChange={setFilterStart}
                  format="YYYY/MM/DD"
                  inputClass="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#ed6e2b] focus:bg-white focus:ring-4 focus:ring-orange-50"
                  containerClassName="w-full"
                />
              ) : (
                <div className="h-[46px] w-full animate-pulse rounded-xl bg-slate-100" />
              )}
            </div>

            <div className="hidden h-px w-5 bg-slate-300 md:block mb-3" />

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                تا تاریخ
              </label>

              {isMounted ? (
                <DatePicker
                  value={filterEnd}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  onChange={setFilterEnd}
                  format="YYYY/MM/DD"
                  inputClass="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#ed6e2b] focus:bg-white focus:ring-4 focus:ring-orange-50"
                  containerClassName="w-full"
                />
              ) : (
                <div className="h-[46px] w-full animate-pulse rounded-xl bg-slate-100" />
              )}
            </div>

            <button
              type="button"
              onClick={applyDateFilter}
              className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl bg-[#ed6e2b] px-6 text-sm font-bold text-white transition hover:bg-[#d95f20] focus:outline-none focus:ring-4 focus:ring-orange-100"
            >
              <Search className="h-4 w-4" />
              اعمال فیلتر
            </button>
          </div>
        </section>

        {/* Records */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#ed6e2b]">
                <FileText className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  سوابق مرخصی
                </h2>

                <p className="text-xs text-slate-500">
                  {requests.length} درخواست
                </p>
              </div>
            </div>
          </div>

          {requests.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-right">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        نوع مرخصی
                      </th>

                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        از تاریخ
                      </th>

                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        تا تاریخ
                      </th>

                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        تعداد روز
                      </th>

                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        توضیحات
                      </th>

                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        وضعیت
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {requests.map((request: any) => {
                      const status = getStatusConfig(request.Status);
                      const StatusIcon = status.icon;

                      return (
                        <tr
                          key={request.Leave_ID}
                          className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <span className="font-semibold text-slate-800">
                              {request.PR_Leave_Types?.Leave_Type_Name ||
                                "-"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {toPersianDate(request.Start_Date)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {toPersianDate(request.End_Date)}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                              {request.Days_Count || 1} روز
                            </span>
                          </td>

                          <td className="max-w-[240px] px-5 py-4">
                            <p className="truncate text-sm text-slate-500">
                              {request.Reason || "-"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${status.className}`}
                            >
                              <StatusIcon className="h-3.5 w-3.5" />
                              {translateLeaveStatus(request.Status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {requests.map((request: any) => {
                  const status = getStatusConfig(request.Status);
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={request.Leave_ID}
                      className="space-y-4 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-400">
                            نوع مرخصی
                          </p>

                          <p className="mt-1 font-bold text-slate-800">
                            {request.PR_Leave_Types?.Leave_Type_Name ||
                              "-"}
                          </p>
                        </div>

                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${status.className}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {translateLeaveStatus(request.Status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] text-slate-400">
                            از تاریخ
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {toPersianDate(request.Start_Date)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] text-slate-400">
                            تا تاریخ
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {toPersianDate(request.End_Date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          مدت مرخصی
                        </span>

                        <span className="text-sm font-bold text-slate-700">
                          {request.Days_Count || 1} روز
                        </span>
                      </div>

                      {request.Reason && (
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="mb-1 text-[11px] text-slate-400">
                            توضیحات
                          </p>

                          <p className="text-sm leading-6 text-slate-600">
                            {request.Reason}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Calendar className="h-7 w-7" />
              </div>

              <h3 className="font-bold text-slate-700">
                سابقه‌ای یافت نشد
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                در بازه زمانی انتخاب‌شده درخواست مرخصی‌ای ثبت نشده است.
              </p>

              <button
                type="button"
                onClick={openModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-bold text-[#c6531c] transition hover:bg-orange-100"
              >
                <Plus className="h-4 w-4" />
                ثبت درخواست جدید
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#ed6e2b]">
                  <Calendar className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    فرم درخواست مرخصی
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    اطلاعات درخواست خود را وارد کنید
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(100vh-140px)] overflow-y-auto p-5 sm:p-6"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* Leave Type */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    نوع مرخصی <span className="text-red-500">*</span>
                  </label>

                  <input
                    name="leaveTypeName"
                    required
                    list="leave-types-list"
                    placeholder="مثلاً: مرخصی استحقاقی، بیماری، روزانه"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#ed6e2b] focus:bg-white focus:ring-4 focus:ring-orange-50"
                  />

                  <datalist id="leave-types-list">
                    {types.map((type: any) => (
                      <option
                        key={type.Leave_Type_ID}
                        value={type.Leave_Type_Name}
                      />
                    ))}
                  </datalist>

                  <p className="mt-1.5 text-xs text-slate-400">
                    می‌توانید نام نوع مرخصی را وارد کنید یا یکی از موارد قبلی را انتخاب کنید.
                  </p>
                </div>

                {/* Start Date */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    از تاریخ <span className="text-red-500">*</span>
                  </label>

                  {isMounted ? (
                    <DatePicker
                      value={formStart}
                      calendar={persian}
                      locale={persian_fa}
                      calendarPosition="bottom-right"
                      onChange={setFormStart}
                      format="YYYY/MM/DD"
                      inputClass="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#ed6e2b] focus:bg-white focus:ring-4 focus:ring-orange-50"
                      containerClassName="w-full"
                    />
                  ) : (
                    <div className="h-[46px] animate-pulse rounded-xl bg-slate-100" />
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    تا تاریخ <span className="text-red-500">*</span>
                  </label>

                  {isMounted ? (
                    <DatePicker
                      value={formEnd}
                      calendar={persian}
                      locale={persian_fa}
                      calendarPosition="bottom-right"
                      onChange={setFormEnd}
                      format="YYYY/MM/DD"
                      inputClass="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#ed6e2b] focus:bg-white focus:ring-4 focus:ring-orange-50"
                      containerClassName="w-full"
                    />
                  ) : (
                    <div className="h-[46px] animate-pulse rounded-xl bg-slate-100" />
                  )}
                </div>

                {/* Reason */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    دلیل / توضیحات
                  </label>

                  <textarea
                    name="reason"
                    rows={4}
                    placeholder="در صورت نیاز توضیحات خود را وارد کنید..."
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#ed6e2b] focus:bg-white focus:ring-4 focus:ring-orange-50"
                  />
                </div>

                {/* Error */}
                {formError && (
                  <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
                    {formError}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ed6e2b] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#d95f20] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-orange-100"
                >
                  <Save className="h-4 w-4" />
                  ثبت درخواست
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-xl border border-emerald-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-xl">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>

          {toast}
        </div>
      )}
    </div>
  );
}
