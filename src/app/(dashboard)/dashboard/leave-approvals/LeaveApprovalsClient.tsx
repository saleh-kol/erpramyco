"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { reviewLeaveRequestAction } from "@/actions/leave";
import { reviewProjectCompletionAction } from "@/actions/myProjects";
import { reviewMissionRequestAction } from "@/actions/myMissions";

import {
  Search,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  UserCircle2,
  Briefcase,
  Calendar,
  Navigation,
  Crown,
  FileCheck,
} from "lucide-react";

const toPersianDate = (date: Date | string) => {
  if (!date) return "-";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("fa-IR");
};

export default function LeaveApprovalsClient({
  requests,
  currentStatus,
  projects,
  missions,
}: {
  requests: any[];
  currentStatus: string;
  projects: any[];
  missions: any[];
}) {
  const router = useRouter();

  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [activeTab, setActiveTab] = useState<
    "leaves" | "projects" | "missions"
  >("leaves");

  const handleStatusChange = (status: string) => {
    router.push(
      `/dashboard/leave-approvals?status=${encodeURIComponent(status)}`,
    );
  };

  const showToast = (message: string, duration = 3000) => {
    setToast(message);

    setTimeout(() => {
      setToast(null);
    }, duration);
  };

  const handleLeaveAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const result = await reviewLeaveRequestAction(formData);

    if (result?.success) {
      showToast("وضعیت درخواست مرخصی تغییر کرد");
    }
  };

  const handleProjectAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const result: any = await reviewProjectCompletionAction(formData);

    if (result?.success) {
      showToast(result?.message || "وضعیت درخواست پروژه تغییر کرد", 4000);
    }
  };

  const handleMissionAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const result: any = await reviewMissionRequestAction(formData);

    if (result?.success) {
      showToast("وضعیت درخواست مأموریت تغییر کرد");
    }
  };

  const getStatusConfig = (status: string) => {
    if (status === "Approved" || status === "Completed") {
      return {
        label: "تأیید شده",
        className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: Check,
      };
    }

    if (status === "Rejected" || status === "Active") {
      return {
        label: "رد شده",
        className: "border border-red-200 bg-red-50 text-red-700",
        icon: XCircle,
      };
    }

    return {
      label: "در انتظار تأیید",
      className: "border border-orange-200 bg-orange-50 text-[#c6531c]",
      icon: Clock,
    };
  };

  const filteredRequests = requests.filter((r) => {
    const search = searchTerm.toLowerCase();

    return (
      r.Personnel_PR_Leave_Requests_Personnel_IDToPersonnel?.Full_Name?.toLowerCase().includes(
        search,
      ) || r.PR_Leave_Types?.Leave_Type_Name?.toLowerCase().includes(search)
    );
  });

  const filteredProjects = projects.filter((p) => {
    const search = searchTerm.toLowerCase();

    return (
      p.Project_Name?.toLowerCase().includes(search) ||
      p.PR_Project_Assignments?.[0]?.Personnel?.Full_Name?.toLowerCase().includes(
        search,
      )
    );
  });

  const filteredMissions = missions.filter((m) => {
    const search = searchTerm.toLowerCase();

    return (
      m.Personnel?.Full_Name?.toLowerCase().includes(search) ||
      m.Origin?.toLowerCase().includes(search) ||
      m.Destination?.toLowerCase().includes(search)
    );
  });

  const pendingCount =
    activeTab === "leaves"
      ? requests.length
      : activeTab === "projects"
        ? projects.length
        : missions.length;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#ed6e2b]">
                <FileCheck className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  مدیریت درخواست‌ها
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  بررسی و مدیریت درخواست‌های کارکنان
                </p>
              </div>
            </div>

            {currentStatus === "Pending" && (
              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-bold text-[#c6531c]">
                <Clock className="h-4 w-4" />
                {pendingCount.toLocaleString("fa-IR")} درخواست در انتظار بررسی
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            REQUEST TYPE TABS
        ====================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {/* Leaves */}

            <button
              type="button"
              onClick={() => setActiveTab("leaves")}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                activeTab === "leaves"
                  ? "border-orange-200 bg-orange-50 text-[#c6531c]"
                  : "border-transparent bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <Calendar className="h-5 w-5" />

                <span className="text-sm font-bold">درخواست‌های مرخصی</span>
              </span>

              {currentStatus === "Pending" && requests.length > 0 && (
                <span
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                    activeTab === "leaves"
                      ? "bg-orange-100 text-[#c6531c]"
                      : "bg-white text-slate-500"
                  }`}
                >
                  {requests.length.toLocaleString("fa-IR")}
                </span>
              )}
            </button>

            {/* Projects */}

            <button
              type="button"
              onClick={() => setActiveTab("projects")}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                activeTab === "projects"
                  ? "border-orange-200 bg-orange-50 text-[#c6531c]"
                  : "border-transparent bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <Briefcase className="h-5 w-5" />

                <span className="text-sm font-bold">اتمام پروژه</span>
              </span>

              {currentStatus === "Pending" && projects.length > 0 && (
                <span
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                    activeTab === "projects"
                      ? "bg-orange-100 text-[#c6531c]"
                      : "bg-white text-slate-500"
                  }`}
                >
                  {projects.length.toLocaleString("fa-IR")}
                </span>
              )}
            </button>

            {/* Missions */}

            <button
              type="button"
              onClick={() => setActiveTab("missions")}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                activeTab === "missions"
                  ? "border-orange-200 bg-orange-50 text-[#c6531c]"
                  : "border-transparent bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <Navigation className="h-5 w-5" />

                <span className="text-sm font-bold">درخواست‌های مأموریت</span>
              </span>

              {currentStatus === "Pending" && missions.length > 0 && (
                <span
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                    activeTab === "missions"
                      ? "bg-orange-100 text-[#c6531c]"
                      : "bg-white text-slate-500"
                  }`}
                >
                  {missions.length.toLocaleString("fa-IR")}
                </span>
              )}
            </button>
          </div>
        </section>

        {/* =====================================================
            FILTERS
        ====================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Search className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                جستجو و فیلتر درخواست‌ها
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                نام کارمند یا اطلاعات مربوط به درخواست را جستجو کنید
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجوی نام کارمند، پروژه، نوع مرخصی..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#ed6e2b] focus:bg-white focus:ring-4 focus:ring-orange-50"
              />
            </div>

            {/* Status Filters */}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange("Pending")}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                  currentStatus === "Pending"
                    ? "border-[#ed6e2b] bg-[#ed6e2b] text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-[#ed6e2b]"
                }`}
              >
                <Clock className="h-4 w-4" />
                در انتظار
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("Approved")}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                  currentStatus === "Approved"
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                تأیید شده
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange("Rejected")}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                  currentStatus === "Rejected"
                    ? "border-red-600 bg-red-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                }`}
              >
                <XCircle className="h-4 w-4" />
                رد شده
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================
            LEAVE REQUESTS
        ====================================================== */}

        {activeTab === "leaves" && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#ed6e2b]">
                  <Calendar className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    درخواست‌های مرخصی
                  </h2>

                  <p className="text-xs text-slate-500">
                    {filteredRequests.length.toLocaleString("fa-IR")} درخواست
                  </p>
                </div>
              </div>
            </div>

            {filteredRequests.length > 0 ? (
              <>
                {/* Desktop */}

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] text-right">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-5 py-4 text-xs font-bold text-slate-500">
                          کارمند
                        </th>

                        <th className="px-5 py-4 text-xs font-bold text-slate-500">
                          نوع مرخصی
                        </th>

                        <th className="px-5 py-4 text-xs font-bold text-slate-500">
                          از تاریخ
                        </th>

                        <th className="px-5 py-4 text-xs font-bold text-slate-500">
                          مدت
                        </th>

                        <th className="px-5 py-4 text-xs font-bold text-slate-500">
                          وضعیت
                        </th>

                        {currentStatus === "Pending" && (
                          <th className="px-5 py-4 text-xs font-bold text-slate-500">
                            عملیات
                          </th>
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRequests.map((r: any) => {
                        const status = getStatusConfig(r.Status);
                        const StatusIcon = status.icon;

                        return (
                          <tr
                            key={r.Leave_ID}
                            className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                  <UserCircle2 className="h-5 w-5" />
                                </div>

                                <span className="font-semibold text-slate-800">
                                  {r
                                    .Personnel_PR_Leave_Requests_Personnel_IDToPersonnel
                                    ?.Full_Name || "-"}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {r.PR_Leave_Types?.Leave_Type_Name || "-"}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {toPersianDate(r.Start_Date)}
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                {r.Days_Count || 1} روز
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${status.className}`}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                                {status.label}
                              </span>
                            </td>

                            {currentStatus === "Pending" && (
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <form onSubmit={handleLeaveAction}>
                                    <input
                                      type="hidden"
                                      name="leaveId"
                                      value={r.Leave_ID}
                                    />

                                    <input
                                      type="hidden"
                                      name="action"
                                      value="approve"
                                    />

                                    <button
                                      type="submit"
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      تأیید
                                    </button>
                                  </form>

                                  <form onSubmit={handleLeaveAction}>
                                    <input
                                      type="hidden"
                                      name="leaveId"
                                      value={r.Leave_ID}
                                    />

                                    <input
                                      type="hidden"
                                      name="action"
                                      value="reject"
                                    />

                                    <button
                                      type="submit"
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      رد
                                    </button>
                                  </form>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}

                <div className="divide-y divide-slate-100 md:hidden">
                  {filteredRequests.map((r: any) => {
                    const status = getStatusConfig(r.Status);
                    const StatusIcon = status.icon;

                    return (
                      <div key={r.Leave_ID} className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                              <UserCircle2 className="h-5 w-5" />
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">کارمند</p>

                              <p className="mt-1 font-bold text-slate-800">
                                {r
                                  .Personnel_PR_Leave_Requests_Personnel_IDToPersonnel
                                  ?.Full_Name || "-"}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${status.className}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-[11px] text-slate-400">
                            نوع مرخصی
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {r.PR_Leave_Types?.Leave_Type_Name || "-"}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[11px] text-slate-400">
                              از تاریخ
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {toPersianDate(r.Start_Date)}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[11px] text-slate-400">مدت</p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {r.Days_Count || 1} روز
                            </p>
                          </div>
                        </div>

                        {currentStatus === "Pending" && (
                          <div className="flex gap-2 pt-1">
                            <form
                              onSubmit={handleLeaveAction}
                              className="flex-1"
                            >
                              <input
                                type="hidden"
                                name="leaveId"
                                value={r.Leave_ID}
                              />

                              <input
                                type="hidden"
                                name="action"
                                value="approve"
                              />

                              <button
                                type="submit"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                              >
                                <Check className="h-4 w-4" />
                                تأیید
                              </button>
                            </form>

                            <form
                              onSubmit={handleLeaveAction}
                              className="flex-1"
                            >
                              <input
                                type="hidden"
                                name="leaveId"
                                value={r.Leave_ID}
                              />

                              <input
                                type="hidden"
                                name="action"
                                value="reject"
                              />

                              <button
                                type="submit"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
                              >
                                <X className="h-4 w-4" />
                                رد
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <EmptyState />
            )}
          </section>
        )}

        {/* =====================================================
            PROJECT REQUESTS
        ====================================================== */}

        {activeTab === "projects" && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={<Briefcase className="h-4 w-4" />}
              title="درخواست‌های اتمام پروژه"
              count={filteredProjects.length}
            />

            {filteredProjects.length > 0 ? (
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-right">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        نام پروژه
                      </th>

                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        مسئول پروژه
                      </th>

                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        تاریخ طلایی
                      </th>

                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        تاریخ پایان
                      </th>

                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        پاداش
                      </th>

                      {currentStatus === "Pending" && (
                        <th className="px-5 py-4 text-xs font-bold text-slate-500">
                          عملیات
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProjects.map((p: any) => (
                      <tr
                        key={p.Project_ID}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {p.Project_Name || "-"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#d97706]">
                              <Crown className="h-4 w-4" />
                            </div>

                            {p.Project_Leader?.Full_Name || "-"}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#c6531c]">
                          {toPersianDate(p.Golden_Date)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {toPersianDate(p.End_Date)}
                        </td>

                        <td className="px-5 py-4">
                          {p.Final_Bonus != null ? (
                            <span className="font-bold text-emerald-700">
                              {Number(p.Final_Bonus).toLocaleString("fa-IR")}{" "}
                              ریال
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">
                              پس از تأیید محاسبه می‌شود
                            </span>
                          )}
                        </td>

                        {currentStatus === "Pending" && (
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <form onSubmit={handleProjectAction}>
                                <input
                                  type="hidden"
                                  name="projectId"
                                  value={p.Project_ID}
                                />

                                <input
                                  type="hidden"
                                  name="action"
                                  value="approve"
                                />

                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  تأیید
                                </button>
                              </form>

                              <form onSubmit={handleProjectAction}>
                                <input
                                  type="hidden"
                                  name="projectId"
                                  value={p.Project_ID}
                                />

                                <input
                                  type="hidden"
                                  name="action"
                                  value="reject"
                                />

                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  رد
                                </button>
                              </form>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        )}

        {/* =====================================================
            MISSION REQUESTS
        ====================================================== */}

        {activeTab === "missions" && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              icon={<Navigation className="h-4 w-4" />}
              title="درخواست‌های مأموریت"
              count={filteredMissions.length}
            />

            {filteredMissions.length > 0 ? (
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-right">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        کارمند
                      </th>

                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        مسیر
                      </th>

                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        تاریخ
                      </th>

                      <th className="px-5 py-4 text-xs font-bold text-slate-500">
                        مبلغ
                      </th>

                      {currentStatus === "Pending" && (
                        <th className="px-5 py-4 text-xs font-bold text-slate-500">
                          عملیات
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMissions.map((m: any) => (
                      <tr
                        key={m.Commute_ID}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                              <UserCircle2 className="h-5 w-5" />
                            </div>

                            <span className="font-semibold text-slate-800">
                              {m.Personnel?.Full_Name || "-"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {m.Origin || "-"} به {m.Destination || "-"}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {toPersianDate(m.Commute_Date)}
                        </td>

                        <td className="px-5 py-4 font-semibold text-slate-700">
                          {Number(m.Amount || 0).toLocaleString("fa-IR")} ریال
                        </td>

                        {currentStatus === "Pending" && (
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <form onSubmit={handleMissionAction}>
                                <input
                                  type="hidden"
                                  name="commuteId"
                                  value={m.Commute_ID}
                                />

                                <input
                                  type="hidden"
                                  name="action"
                                  value="approve"
                                />

                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  تأیید
                                </button>
                              </form>

                              <form onSubmit={handleMissionAction}>
                                <input
                                  type="hidden"
                                  name="commuteId"
                                  value={m.Commute_ID}
                                />

                                <input
                                  type="hidden"
                                  name="action"
                                  value="reject"
                                />

                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  رد
                                </button>
                              </form>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState />
            )}
          </section>
        )}
      </div>

      {/* =====================================================
          TOAST
      ====================================================== */}

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

/* ============================================================
   REUSABLE SECTION HEADER
============================================================ */

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#ed6e2b]">
          {icon}
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>

          <p className="text-xs text-slate-500">
            {count.toLocaleString("fa-IR")} درخواست
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FileCheck className="h-7 w-7" />
      </div>

      <h3 className="font-bold text-slate-700">درخواستی یافت نشد</h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
        در حال حاضر درخواستی مطابق فیلترها و جستجوی انتخاب‌شده وجود ندارد.
      </p>
    </div>
  );
}
