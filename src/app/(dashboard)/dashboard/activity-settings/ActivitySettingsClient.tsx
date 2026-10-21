"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  addWorkTypeAction,
  deleteWorkTypeAction,
  addLocationAction,
  deleteLocationAction,
  updateWorkTypeAction,
  updateLocationAction,
} from "@/actions/activitySettings";

import {
  Plus,
  Trash2,
  Briefcase,
  MapPin,
  CheckCircle,
  Pencil,
  X,
  Check,
  AlertCircle,
} from "lucide-react";

export default function ActivitySettingsClient({
  types,
  locations,
}: {
  types: any[];
  locations: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [typeInput, setTypeInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ✅ ویرایش درجالین
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editTypeName, setEditTypeName] = useState("");
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [editLocationName, setEditLocationName] = useState("");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ---------- انواع فعالیت ----------
  const handleAddType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", typeInput);

    startTransition(async () => {
      const res: any = await addWorkTypeAction(fd);
      if (res?.error) {
        showToast(res.error, "error");
      } else {
        setTypeInput("");
        showToast("نوع فعالیت اضافه شد");
        router.refresh();
      }
    });
  };

  const handleUpdateType = () => {
    if (!editTypeName.trim()) {
      showToast("نام نمی‌تواند خالی باشد", "error");
      return;
    }
    const fd = new FormData();
    fd.append("id", String(editingTypeId));
    fd.append("name", editTypeName);

    startTransition(async () => {
      const res: any = await updateWorkTypeAction(fd);
      if (res?.error) {
        showToast(res.error, "error");
      } else {
        setEditingTypeId(null);
        showToast("نوع فعالیت ویرایش شد");
        router.refresh();
      }
    });
  };

  const handleDeleteType = (id: number) => {
    const fd = new FormData();
    fd.append("id", String(id));

    startTransition(async () => {
      const res: any = await deleteWorkTypeAction(fd);
      if (res?.error) {
        showToast(res.error, "error");
      } else {
        showToast("نوع فعالیت حذف شد");
        router.refresh();
      }
    });
  };

  // ---------- محل‌های فعالیت ----------
  const handleAddLocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", locationInput);

    startTransition(async () => {
      const res: any = await addLocationAction(fd);
      if (res?.error) {
        showToast(res.error, "error");
      } else {
        setLocationInput("");
        showToast("محل فعالیت اضافه شد");
        router.refresh();
      }
    });
  };

  const handleUpdateLocation = () => {
    if (!editLocationName.trim()) {
      showToast("نام نمی‌تواند خالی باشد", "error");
      return;
    }
    const fd = new FormData();
    fd.append("id", String(editingLocationId));
    fd.append("name", editLocationName);

    startTransition(async () => {
      const res: any = await updateLocationAction(fd);
      if (res?.error) {
        showToast(res.error, "error");
      } else {
        setEditingLocationId(null);
        showToast("محل فعالیت ویرایش شد");
        router.refresh();
      }
    });
  };

  const handleDeleteLocation = (id: number) => {
    const fd = new FormData();
    fd.append("id", String(id));

    startTransition(async () => {
      const res: any = await deleteLocationAction(fd);
      if (res?.error) {
        showToast(res.error, "error");
      } else {
        showToast("محل فعالیت حذف شد");
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-128px)] bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">

        {/* Header */}
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
              <Briefcase className="h-4 w-4 text-[#ed6e2b]" />
            </div>

            <span className="text-xs font-semibold text-slate-400">
              تنظیمات سامانه
            </span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            تنظیمات فعالیت‌ها
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            انواع فعالیت و محل‌های قابل استفاده در ثبت فعالیت کارکنان را مدیریت کنید.
          </p>
        </div>

        {/* Main */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Work Types */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                  <Briefcase className="h-5 w-5 text-[#ed6e2b]" />
                </div>

                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    انواع فعالیت‌ها
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-400">
                    {types.length} نوع فعالیت ثبت شده
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">

              {/* Add */}
              <form onSubmit={handleAddType} className="mb-5 flex gap-2">
                <input
                  name="name"
                  required
                  type="text"
                  placeholder="نام نوع فعالیت جدید..."
                  value={typeInput}
                  onChange={(e) => setTypeInput(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-[#ed6e2b] focus:bg-white focus:ring-4 focus:ring-orange-100"
                />

                <button
                  type="submit"
                  disabled={isPending}
                  aria-label="افزودن نوع فعالیت"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ed6e2b] text-white shadow-sm shadow-orange-200 transition-all hover:bg-[#d95f20] hover:shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-wait"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </form>

              {/* List */}
              <div className="space-y-2">
                {types.length > 0 ? (
                  types.map((type: any) => (
                    <div
                      key={type.Work_Type_ID}
                      className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 transition-all hover:border-orange-100 hover:bg-orange-50/40"
                    >
                      {editingTypeId === type.Work_Type_ID ? (
                        // ✅ حالت ویرایش
                        <div className="flex w-full items-center gap-2">
                          <input
                            autoFocus
                            value={editTypeName}
                            onChange={(e) => setEditTypeName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateType();
                              if (e.key === "Escape") setEditingTypeId(null);
                            }}
                            className="min-w-0 flex-1 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-[#ed6e2b]"
                          />
                          <button
                            type="button"
                            onClick={handleUpdateType}
                            disabled={isPending}
                            title="ذخیره"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 transition hover:bg-green-100 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTypeId(null)}
                            title="انصراف"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        // حالت نمایش
                        <>
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white">
                              <Briefcase className="h-4 w-4 text-slate-400 transition-colors group-hover:text-[#ed6e2b]" />
                            </div>

                            <span className="truncate text-sm font-semibold text-slate-700">
                              {type.Work_Type_Name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => { setEditingTypeId(type.Work_Type_ID); setEditTypeName(type.Work_Type_Name); }}
                              disabled={isPending}
                              aria-label={`ویرایش ${type.Work_Type_Name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-orange-50 hover:text-[#ed6e2b] disabled:opacity-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteType(type.Work_Type_ID)}
                              disabled={isPending}
                              aria-label={`حذف ${type.Work_Type_Name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                    <Briefcase className="mx-auto mb-3 h-7 w-7 text-slate-300" />

                    <p className="text-xs font-medium text-slate-400">
                      هنوز نوع فعالیتی ثبت نشده است
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Locations */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                  <MapPin className="h-5 w-5 text-[#ed6e2b]" />
                </div>

                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    محل‌های فعالیت
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-400">
                    {locations.length} محل فعالیت ثبت شده
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">

              {/* Add */}
              <form onSubmit={handleAddLocation} className="mb-5 flex gap-2">
                <input
                  name="name"
                  required
                  type="text"
                  placeholder="نام محل فعالیت جدید..."
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-[#ed6e2b] focus:bg-white focus:ring-4 focus:ring-orange-100"
                />

                <button
                  type="submit"
                  disabled={isPending}
                  aria-label="افزودن محل فعالیت"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ed6e2b] text-white shadow-sm shadow-orange-200 transition-all hover:bg-[#d95f20] hover:shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-wait"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </form>

              {/* List */}
              <div className="space-y-2">
                {locations.length > 0 ? (
                  locations.map((location: any) => (
                    <div
                      key={location.Location_ID}
                      className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 transition-all hover:border-orange-100 hover:bg-orange-50/40"
                    >
                      {editingLocationId === location.Location_ID ? (
                        // ✅ حالت ویرایش
                        <div className="flex w-full items-center gap-2">
                          <input
                            autoFocus
                            value={editLocationName}
                            onChange={(e) => setEditLocationName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateLocation();
                              if (e.key === "Escape") setEditingLocationId(null);
                            }}
                            className="min-w-0 flex-1 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-[#ed6e2b]"
                          />
                          <button
                            type="button"
                            onClick={handleUpdateLocation}
                            disabled={isPending}
                            title="ذخیره"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 transition hover:bg-green-100 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLocationId(null)}
                            title="انصراف"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        // حالت نمایش
                        <>
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white">
                              <MapPin className="h-4 w-4 text-slate-400 transition-colors group-hover:text-[#ed6e2b]" />
                            </div>

                            <span className="truncate text-sm font-semibold text-slate-700">
                              {location.Location_Name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => { setEditingLocationId(location.Location_ID); setEditLocationName(location.Location_Name); }}
                              disabled={isPending}
                              aria-label={`ویرایش ${location.Location_Name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-orange-50 hover:text-[#ed6e2b] disabled:opacity-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteLocation(location.Location_ID)}
                              disabled={isPending}
                              aria-label={`حذف ${location.Location_Name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                    <MapPin className="mx-auto mb-3 h-7 w-7 text-slate-300" />

                    <p className="text-xs font-medium text-slate-400">
                      هنوز محل فعالیتی ثبت نشده است
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
          {toast.type === "error" ? (
            <AlertCircle className="h-5 w-5 text-red-400" />
          ) : (
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}