"use client";

import { useState } from "react";
import { savePersonnelHoursAction } from "@/actions/hoursSettings";
import {
  Search,
  Clock,
  X,
  Save,
  CheckCircle,
  UserCircle2,
  AlertCircle,
  UserRound,
} from "lucide-react";

export default function HoursSettingsClient({
  personnel,
}: {
  personnel: any[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredPersonnel = personnel.filter(
    (p) =>
      p.Full_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Personnel_Code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (person: any) => {
    setSelectedPerson(person);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPerson(null);
    setFormError(null);
  };

  const showToast = (message: string) => {
    setToast(message);

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setFormError(null);

    const formData = new FormData(e.currentTarget);

    const fields = [
      "Week1_Max_Hours",
      "Week1_Max_Overtime",
      "Week2_Max_Hours",
      "Week2_Max_Overtime",
      "Week3_Max_Hours",
      "Week3_Max_Overtime",
      "Week4_Max_Hours",
      "Week4_Max_Overtime",
      "MonthEnd_Max_Hours",
      "MonthEnd_Max_Overtime",
      "Max_Friday_Hours_Month",
      "Max_Holiday_Hours_Month",
    ];

    let isValid = true;

    fields.forEach((field) => {
      const value = formData.get(field);

      if (value === "" || value === null) {
        isValid = false;
      }
    });

    if (!isValid) {
      setFormError(
        "لطفاً تمام فیلدها را پر کنید. هیچ فیلدی نمی‌تواند خالی باشد."
      );
      return;
    }

    try {
      await savePersonnelHoursAction(formData);

      closeModal();
      showToast("تنظیمات ساعات کاری با موفقیت ذخیره شد");
    } catch {
      setFormError(
        "ذخیره تنظیمات با خطا مواجه شد. لطفاً دوباره تلاش کنید."
      );
    }
  };

  const weekSettings = [
    { week: "Week1", label: "هفته اول" },
    { week: "Week2", label: "هفته دوم" },
    { week: "Week3", label: "هفته سوم" },
    { week: "Week4", label: "هفته چهارم" },
    { week: "MonthEnd", label: "روزهای آخر ماه" },
  ];

  const finance = selectedPerson?.PR_Personnel_Finance?.[0];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
              <Clock className="h-5 w-5 text-[#ed6e2b]" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                تنظیم ساعات کاری
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                مدیریت سقف ساعات کاری و اضافه‌کاری پرسنل
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی نام یا کد پرسنلی..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-11 pl-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#ed6e2b] focus:ring-4 focus:ring-orange-100"
            />
          </div>
        </div>

        {/* Personnel title */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              پرسنل سازمان
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              برای تنظیم ساعات کاری، پرسنل موردنظر را انتخاب کنید.
            </p>
          </div>

          <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-[#ed6e2b]">
            {filteredPersonnel.length} نفر
          </span>
        </div>

        {/* Personnel Cards */}
        {filteredPersonnel.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPersonnel.map((p: any) => (
              <button
                key={p.Personnel_ID}
                type="button"
                onClick={() => openModal(p)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-right shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
              >
                {/* Avatar */}
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                  {p.Personal_Image_Path ? (
                    <img
                      src={p.Personal_Image_Path}
                      alt={p.Full_Name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle2 className="h-9 w-9 text-slate-300" />
                  )}
                </div>

                {/* Personnel information */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {p.Full_Name}
                  </p>

                  <div className="mt-1.5 flex flex-col gap-0.5">
                    <p className="truncate text-xs text-slate-500">
                      {p.OrganizationalPosition?.Name ||
                        "بدون جایگاه سازمانی"}
                    </p>

                    <p className="truncate text-[11px] text-slate-400">
                      {p.Unit?.Name || "بدون واحد"}
                    </p>
                  </div>
                </div>

                {/* Clock */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 transition-colors group-hover:bg-[#ed6e2b]">
                  <Clock className="h-4 w-4 text-[#ed6e2b] group-hover:text-white" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <UserRound className="h-7 w-7 text-slate-400" />
            </div>

            <p className="text-sm font-bold text-slate-700">
              پرسنلی پیدا نشد
            </p>

            <p className="mt-1 text-xs text-slate-400">
              نام یا کد پرسنلی موردنظر را بررسی کنید.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedPerson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm md:p-6"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50">
                  {selectedPerson.Personal_Image_Path ? (
                    <img
                      src={selectedPerson.Personal_Image_Path}
                      alt={selectedPerson.Full_Name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle2 className="h-7 w-7 text-[#ed6e2b]" />
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-900 md:text-base">
                    تنظیم ساعات کاری
                  </h2>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {selectedPerson.Full_Name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="بستن"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto p-4 md:p-6"
            >
              <input
                type="hidden"
                name="financeId"
                value={finance?.Finance_ID || ""}
              />

              <input
                type="hidden"
                name="personnelId"
                value={selectedPerson.Personnel_ID}
              />

              {/* Selected person info */}
              <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <span className="text-[11px] text-slate-400">
                    جایگاه سازمانی
                  </span>

                  <p className="mt-0.5 text-xs font-semibold text-slate-700">
                    {selectedPerson.OrganizationalPosition?.Name ||
                      "بدون جایگاه سازمانی"}
                  </p>
                </div>

                <div className="hidden h-7 w-px bg-slate-200 sm:block" />

                <div>
                  <span className="text-[11px] text-slate-400">
                    واحد
                  </span>

                  <p className="mt-0.5 text-xs font-semibold text-slate-700">
                    {selectedPerson.Unit?.Name || "بدون واحد"}
                  </p>
                </div>

                <div className="hidden h-7 w-px bg-slate-200 sm:block" />

                <div>
                  <span className="text-[11px] text-slate-400">
                    کد پرسنلی
                  </span>

                  <p className="mt-0.5 text-xs font-semibold text-slate-700">
                    {selectedPerson.Personnel_Code}
                  </p>
                </div>
              </div>

              {/* Weekly settings */}
              <div className="mb-7">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    ساعات کاری دوره‌ای
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    حداکثر ساعات کار و اضافه‌کاری هر بازه را مشخص کنید.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {weekSettings.map((w) => (
                    <div
                      key={w.week}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="mb-4 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#ed6e2b]" />

                        <h4 className="text-sm font-bold text-slate-800">
                          {w.label}
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {/* Max Hours */}
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                            حداکثر ساعت کار مجاز
                            <span className="mr-1 text-red-500">
                              *
                            </span>
                          </label>

                          <div className="relative">
                            <input
                              name={`${w.week}_Max_Hours`}
                              type="number"
                              required
                              min="0"
                              step="1.00"
                              defaultValue={
                                finance?.[`${w.week}_Max_Hours`] ?? 0
                              }
                              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pl-12 text-sm text-slate-900 outline-none transition focus:border-[#ed6e2b] focus:ring-4 focus:ring-orange-100"
                            />

                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                              ساعت
                            </span>
                          </div>
                        </div>

                        {/* Overtime */}
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                            حداکثر ساعت اضافه‌کاری
                            <span className="mr-1 text-red-500">
                              *
                            </span>
                          </label>

                          <div className="relative">
                            <input
                              name={`${w.week}_Max_Overtime`}
                              type="number"
                              required
                              min="0"
                              step="1.00"
                              defaultValue={
                                finance?.[
                                  `${w.week}_Max_Overtime`
                                ] ?? 0
                              }
                              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pl-12 text-sm text-slate-900 outline-none transition focus:border-[#ed6e2b] focus:ring-4 focus:ring-orange-100"
                            />

                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                              ساعت
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly settings */}
              <div className="mb-6">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    سقف ساعات ویژه ماهانه
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    حداکثر ساعات مجاز جمعه‌کاری و تعطیل‌کاری در ماه.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                    <label className="mb-2 block text-xs font-bold text-[#c6531c]">
                      حداکثر ساعت مجاز جمعه‌کاری در ماه
                      <span className="mr-1 text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <input
                        name="Max_Friday_Hours_Month"
                        type="number"
                        required
                        min="0"
                        step="1.00"
                        defaultValue={
                          finance?.Max_Friday_Hours_Month ?? 0
                        }
                        className="h-11 w-full rounded-lg border border-orange-200 bg-white px-3 pl-12 text-sm text-slate-900 outline-none transition focus:border-[#ed6e2b] focus:ring-4 focus:ring-orange-100"
                      />

                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                        ساعت
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
                    <label className="mb-2 block text-xs font-bold text-[#c6531c]">
                      حداکثر ساعت مجاز تعطیل‌کاری در ماه
                      <span className="mr-1 text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <input
                        name="Max_Holiday_Hours_Month"
                        type="number"
                        required
                        min="0"
                        step="1.00"
                        defaultValue={
                          finance?.Max_Holiday_Hours_Month ?? 0
                        }
                        className="h-11 w-full rounded-lg border border-orange-200 bg-white px-3 pl-12 text-sm text-slate-900 outline-none transition focus:border-[#ed6e2b] focus:ring-4 focus:ring-orange-100"
                      />

                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                        ساعت
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error */}
              {formError && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ed6e2b] px-7 text-sm font-bold text-white shadow-sm transition hover:bg-[#d95f20] hover:shadow-md active:scale-[0.98]"
                >
                  <Save className="h-5 w-5" />
                  ذخیره تنظیمات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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