"use client";

import { useRouter } from "next/navigation";
import {
  Calendar,
  Briefcase,
  Navigation,
  Users,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Clock3,
} from "lucide-react";

const toPersianDate = (date: Date | string) => {
  if (!date) return "-";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("fa-IR");
};

export default function ManagerDashboard({
  data,
  user,
}: {
  data: any;
  user: any;
}) {
  const router = useRouter();

  const pendingTotal =
    data.pendingApprovals.leaves +
    data.pendingApprovals.projects +
    data.pendingApprovals.missions;

  const approvalCards = [
    {
      title: "درخواست مرخصی",
      description:
        data.pendingApprovals.leaves > 0
          ? "در انتظار بررسی شما"
          : "درخواستی در انتظار نیست",
      count: data.pendingApprovals.leaves,
      icon: Calendar,
      color: "blue",
      href: "/dashboard/leave-approvals",
    },
    {
      title: "اتمام پروژه",
      description:
        data.pendingApprovals.projects > 0
          ? "در انتظار بررسی شما"
          : "درخواستی در انتظار نیست",
      count: data.pendingApprovals.projects,
      icon: Briefcase,
      color: "orange",
      href: "/dashboard/projects",
    },
    {
      title: "درخواست مأموریت",
      description:
        data.pendingApprovals.missions > 0
          ? "در انتظار بررسی شما"
          : "درخواستی در انتظار نیست",
      count: data.pendingApprovals.missions,
      icon: Navigation,
      color: "red",
      href: "/dashboard/missions",
    },
  ];

  const stats = [
    {
      title: "پرسنل فعال",
      description: "پرسنل سازمان",
      value: data.stats.activePersonnel,
      icon: Users,
      color: "blue",
    },
    {
      title: "پروژه‌های فعال",
      description: "در حال انجام",
      value: data.stats.totalProjects,
      icon: Briefcase,
      color: "orange",
    },
    {
      title: "ابلاغیه‌ها",
      description: "در انتظار انجام",
      value: data.stats.pendingTasks,
      icon: FileText,
      color: "red",
    },
  ];

  return (
    <main className="min-h-[calc(100vh-128px)] bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">

        {/* Header */}
        <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-slate-500">
                داشبورد مدیریت
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {user.name} عزیز، خوش آمدید
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              نمای کلی وضعیت سازمان و مواردی که نیاز به بررسی شما دارند.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <Briefcase className="h-5 w-5 text-orange-500" />
            </div>

            <div>
              <span className="block text-[11px] text-slate-400">
                نقش کاربری
              </span>
              <span className="text-sm font-bold text-slate-800">
                مدیرعامل
              </span>
            </div>
          </div>
        </section>

        {/* Pending approvals */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                موارد نیازمند بررسی
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                درخواست‌هایی که منتظر تصمیم شما هستند
              </p>
            </div>

            {pendingTotal > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5">
                <Clock3 className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-xs font-bold text-orange-600">
                  {pendingTotal} مورد
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {approvalCards.map((item) => {
              const Icon = item.icon;
              const hasPending = item.count > 0;

              const iconClasses = {
                blue: "bg-blue-50 text-blue-600",
                orange: "bg-orange-50 text-orange-600",
                red: "bg-red-50 text-red-600",
              };

              return (
                <button
                  key={item.title}
                  onClick={() => router.push(item.href)}
                  className={`
                    group relative overflow-hidden rounded-2xl border
                    bg-white p-5 text-right transition-all duration-300
                    hover:-translate-y-1 hover:shadow-xl
                    ${
                      hasPending
                        ? "border-orange-100 shadow-sm"
                        : "border-slate-200 shadow-sm"
                    }
                  `}
                >
                  {hasPending && (
                    <div className="absolute right-0 top-0 h-1 w-full bg-gradient-to-l from-orange-500 to-orange-300" />
                  )}

                  <div className="mb-5 flex items-center justify-between">
                    <div
                      className={`
                        flex h-12 w-12 items-center justify-center rounded-2xl
                        ${iconClasses[item.color as keyof typeof iconClasses]}
                      `}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    {hasPending ? (
                      <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-red-500 px-2 text-sm font-extrabold text-white shadow-sm">
                        {item.count}
                      </span>
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-[15px] font-bold text-slate-900">
                        {item.title}
                      </h3>

                      <p
                        className={`mt-1.5 text-xs font-medium ${
                          hasPending
                            ? "text-orange-600"
                            : "text-slate-400"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>

                    <ArrowLeft className="h-4 w-4 shrink-0 text-slate-300 transition-all duration-300 group-hover:-translate-x-1 group-hover:text-slate-500" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Main grid */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_380px]">

          {/* Right column */}
          <div className="space-y-6">

            {/* Active projects */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    پروژه‌های در دست انجام
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    وضعیت پروژه‌های فعال سازمان
                  </p>
                </div>

                <button
                  onClick={() => router.push("/dashboard/projects")}
                  className="group flex items-center gap-1.5 text-xs font-bold text-blue-600 transition-colors hover:text-blue-700"
                >
                  مشاهده همه
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                </button>
              </div>

              <div className="space-y-3">
                {data.activeProjects.length > 0 ? (
                  data.activeProjects.map((p: any) => (
                    <div
                      key={p.Project_ID}
                      className="group flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />

                          <span className="truncate text-sm font-bold text-slate-800">
                            {p.Project_Name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Users className="h-3.5 w-3.5" />
                          <span>
                            {p.Project_Leader?.Full_Name || "تعیین نشده"}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 rounded-xl border border-orange-100 bg-orange-50 px-4 py-2.5">
                        <span className="mb-0.5 block text-[10px] font-medium text-orange-500">
                          مهلت پایان
                        </span>

                        <span className="text-xs font-extrabold text-slate-800">
                          {toPersianDate(
                            p.Deadline_Date || p.End_Date
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                    <Briefcase className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-400">
                      پروژه فعالی وجود ندارد.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Recent activities */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">
                  آخرین فعالیت‌ها
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  آخرین گزارش‌های ثبت‌شده توسط پرسنل
                </p>
              </div>

              <div>
                {data.recentReports.length > 0 ? (
                  data.recentReports.map((r: any, index: number) => (
                    <div
                      key={r.Report_ID}
                      className={`
                        flex items-center gap-3 py-4
                        ${
                          index !== data.recentReports.length - 1
                            ? "border-b border-slate-100"
                            : ""
                        }
                      `}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-extrabold text-slate-500">
                        {r.Personnel?.Full_Name?.charAt(0) || "?"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-slate-800">
                          {r.Personnel?.Full_Name || "ناشناخته"}
                        </span>

                        <span className="mt-1 block text-xs text-slate-400">
                          ثبت فعالیت در تاریخ{" "}
                          {toPersianDate(r.Report_Date)}
                        </span>
                      </div>

                      <div className="shrink-0 rounded-lg bg-emerald-50 px-3 py-1.5">
                        <span className="text-xs font-bold text-emerald-600">
                          {Number(r.Work_Hours || 0).toFixed(1)} ساعت
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <FileText className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm text-slate-400">
                      فعالیتی ثبت نشده است.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Left column - statistics */}
          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                آمار سریع
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                نمای کلی از وضعیت سازمان
              </p>
            </div>

            <div className="space-y-3">
              {stats.map((item) => {
                const Icon = item.icon;

                const iconClasses = {
                  blue: "bg-blue-50 text-blue-600",
                  orange: "bg-orange-50 text-orange-600",
                  red: "bg-red-50 text-red-600",
                };

                return (
                  <div
                    key={item.title}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          flex h-11 w-11 items-center justify-center rounded-xl
                          ${iconClasses[item.color as keyof typeof iconClasses]}
                        `}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div>
                        <span className="block text-sm font-bold text-slate-800">
                          {item.title}
                        </span>

                        <span className="mt-1 block text-[11px] text-slate-400">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Small summary */}
            <div className="mt-5 rounded-xl bg-slate-900 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  وضعیت درخواست‌ها
                </span>

                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>

              <p className="text-sm font-bold text-white">
                {pendingTotal > 0
                  ? `${pendingTotal} درخواست در انتظار بررسی`
                  : "همه درخواست‌ها بررسی شده‌اند"}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
