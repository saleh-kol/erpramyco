"use client";

import { useState } from "react";
import { updateUserAccessAction } from "@/actions/roles";
import {
  UserCircle2,
  ShieldCheck,
  Check,
  Save,
  Users,
  LockKeyhole,
  Search,
} from "lucide-react";

// دیکشنری تبدیل مسیر انگلیسی به نام فارسی
const routeTranslations: Record<string, string> = {
  "/dashboard": "داشبورد",
  "/dashboard/profile": "پروفایل من",
  "/dashboard/attendance": "ثبت فعالیت",
  "/dashboard/leave": "مرخصی‌ها",
  "/dashboard/my-projects": "پروژه‌های من",
  "/dashboard/my-missions": "ماموریت‌های من",
  "/dashboard/my-tasks": "ابلاغیه‌های من",
  "/dashboard/projects": "مدیریت پروژه‌ها",
  "/dashboard/missions": "مدیریت ماموریت‌ها",
  "/dashboard/tasks": "صدور ابلاغیه",
  "/dashboard/personnel": "پرسنل",
  "/dashboard/leave-approvals": "درخواست کارکنان",
  "/dashboard/calendar": "تقویم کاری",
  "/dashboard/payroll-settings": "تنظیمات حقوق و دستمزد",
  "/dashboard/my-work-hours": "گزارش کارکرد من",
  "/dashboard/activity-settings": "تنظیمات فعالیت‌ها",
  "/dashboard/hours-settings": "تنظیمات ساعات کاری",
  "/dashboard/roles": "تعریف نقش‌ها",
  "/dashboard/access-management": "مدیریت دسترسی پرسنل",
};

export default function AccessClient({
  users,
  allRoutes,
}: {
  users: any[];
  allRoutes: string[];
}) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setSelectedRoutes(
      user.UserPageAccess?.map((a: any) => a.Route) || []
    );
  };

  const handleToggleRoute = (route: string) => {
    if (selectedRoutes.includes(route)) {
      setSelectedRoutes(
        selectedRoutes.filter((r) => r !== route)
      );
    } else {
      setSelectedRoutes([...selectedRoutes, route]);
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    setLoading(true);

    try {
      const res = await updateUserAccessAction(
        selectedUser.User_ID,
        selectedRoutes
      );

      if (res?.error) {
        alert(res.error);
      } else {
        alert("دسترسی‌ها با موفقیت بروزرسانی شد");
      }
    } catch (error) {
      console.error(error);
      alert("خطایی هنگام ذخیره دسترسی‌ها رخ داد");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const name =
      u.Personnel?.Full_Name ||
      u.Username ||
      "";

    return name
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const selectedCount = selectedRoutes.length;
  const totalRoutes = allRoutes.length;

  return (
    <div className="min-h-[calc(100vh-128px)] bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">

        {/* Page Header */}
        <div className="mb-7">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
              <ShieldCheck className="h-4 w-4 text-[#ed6e2b]" />
            </div>

            <span className="text-xs font-semibold text-slate-400">
              مدیریت سیستم
            </span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            مدیریت دسترسی پرسنل
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            دسترسی کاربران به بخش‌های مختلف سامانه را مدیریت کنید.
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">

          {/* Users Panel */}
          <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* Users Header */}
            <div className="border-b border-slate-100 p-5">
              <div className="mb-4 flex items-center justify-between">

                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    لیست پرسنل
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-400">
                    {users.length} کاربر ثبت شده
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                  <Users className="h-4 w-4 text-[#ed6e2b]" />
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجوی پرسنل..."
                  className="
                    w-full rounded-xl
                    border border-slate-200
                    bg-slate-50
                    py-2.5 pr-9 pl-3
                    text-xs text-slate-700
                    outline-none
                    transition-all
                    placeholder:text-slate-400
                    focus:border-[#ed6e2b]
                    focus:bg-white
                    focus:ring-4
                    focus:ring-orange-100
                  "
                />
              </div>
            </div>

            {/* Users */}
            <div className="max-h-[600px] space-y-1.5 overflow-y-auto p-3">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isSelected =
                    selectedUser?.User_ID === u.User_ID;

                  const accessCount =
                    u.UserPageAccess?.length || 0;

                  return (
                    <button
                      key={u.User_ID}
                      onClick={() => handleSelectUser(u)}
                      className={`
                        group relative flex w-full items-center gap-3
                        rounded-xl p-3 text-right
                        transition-all duration-200
                        ${
                          isSelected
                            ? "bg-[#ed6e2b] text-white shadow-md shadow-orange-200"
                            : "text-slate-700 hover:bg-orange-50/60"
                        }
                      `}
                    >
                      {/* Active indicator */}
                      {isSelected && (
                        <div className="absolute right-0 top-2 bottom-2 w-1 rounded-l-full bg-white/80" />
                      )}

                      {/* Avatar */}
                      {u.Personnel?.Personal_Image_Path ? (
                        <img
                          src={u.Personnel.Personal_Image_Path}
                          alt="profile"
                          className="h-11 w-11 shrink-0 rounded-xl object-cover ring-2 ring-white/20"
                        />
                      ) : (
                        <div
                          className={`
                            flex h-11 w-11 shrink-0 items-center
                            justify-center rounded-xl
                            ${
                              isSelected
                                ? "bg-white/15"
                                : "bg-slate-100"
                            }
                          `}
                        >
                          <UserCircle2
                            className={`
                              h-6 w-6
                              ${
                                isSelected
                                  ? "text-white/80"
                                  : "text-slate-400"
                              }
                            `}
                          />
                        </div>
                      )}

                      {/* User Info */}
                      <div className="min-w-0 flex-1">
                        <div
                          className={`
                            truncate text-sm font-bold
                            ${
                              isSelected
                                ? "text-white"
                                : "text-slate-800"
                            }
                          `}
                        >
                          {u.Personnel?.Full_Name || u.Username}
                        </div>

                        <div
                          className={`
                            mt-1 truncate text-[10px]
                            ${
                              isSelected
                                ? "text-white/70"
                                : "text-slate-400"
                            }
                          `}
                        >
                          {u.Personnel?.OrganizationalPosition?.Name ||
                            "بدون جایگاه"}
                        </div>
                      </div>

                      {/* Access Count */}
                      <div
                        className={`
                          shrink-0 rounded-lg px-2 py-1
                          text-[10px] font-bold
                          ${
                            isSelected
                              ? "bg-white/15 text-white"
                              : "bg-slate-100 text-slate-500"
                          }
                        `}
                      >
                        {accessCount}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-10 text-center">
                  <Search className="mx-auto mb-3 h-7 w-7 text-slate-300" />

                  <p className="text-xs text-slate-400">
                    کاربری پیدا نشد
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* Permission Panel */}
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {selectedUser ? (
              <>
                {/* Permission Header */}
                <div className="border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                        <LockKeyhole className="h-5 w-5 text-[#ed6e2b]" />
                      </div>

                      <div>
                        <span className="block text-[11px] text-slate-400">
                          مدیریت دسترسی
                        </span>

                        <h2 className="mt-0.5 text-base font-extrabold text-slate-900">
                          {selectedUser.Personnel?.Full_Name ||
                            selectedUser.Username}
                        </h2>
                      </div>
                    </div>

                    {/* Save */}
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="
                        flex items-center justify-center gap-2
                        rounded-xl
                        bg-[#ed6e2b]
                        px-5 py-2.5
                        text-xs font-bold text-white
                        shadow-sm shadow-orange-200
                        transition-all duration-200
                        hover:bg-[#d95f20]
                        hover:shadow-md
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                    >
                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          در حال ذخیره...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          ذخیره تغییرات
                        </>
                      )}
                    </button>
                  </div>

                  {/* Access Summary */}
                  <div className="mt-5 flex flex-wrap gap-2">

                    <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#ed6e2b]" />

                      <span className="text-[11px] font-bold text-[#c6531c]">
                        {selectedCount} دسترسی فعال
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-[11px] font-medium text-slate-500">
                        از {totalRoutes} بخش سیستم
                      </span>
                    </div>
                  </div>
                </div>

                {/* Routes */}
                <div className="p-5 sm:p-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      دسترسی به صفحات
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      بخش‌هایی که این کاربر اجازه مشاهده و استفاده از
                      آن‌ها را دارد.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {allRoutes.map((route) => {
                      const checked =
                        selectedRoutes.includes(route);

                      return (
                        <label
                          key={route}
                          className={`
                            group relative flex cursor-pointer
                            items-center gap-3 rounded-xl border p-3.5
                            transition-all duration-200
                            ${
                              checked
                                ? "border-orange-200 bg-orange-50/70"
                                : "border-slate-100 bg-slate-50/50 hover:border-orange-200 hover:bg-white"
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              handleToggleRoute(route)
                            }
                            className="sr-only"
                          />

                          {/* Custom Checkbox */}
                          <div
                            className={`
                              flex h-5 w-5 shrink-0 items-center
                              justify-center rounded-md border
                              transition-all duration-200
                              ${
                                checked
                                  ? "border-[#ed6e2b] bg-[#ed6e2b] shadow-sm shadow-orange-200"
                                  : "border-slate-300 bg-white group-hover:border-[#ed6e2b]"
                              }
                            `}
                          >
                            {checked && (
                              <Check className="h-3.5 w-3.5 text-white" />
                            )}
                          </div>

                          {/* Route Name */}
                          <span
                            className={`
                              text-xs font-semibold
                              ${
                                checked
                                  ? "text-[#c6531c]"
                                  : "text-slate-700"
                              }
                            `}
                          >
                            {routeTranslations[route] || route}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex min-h-[550px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                  <ShieldCheck className="h-8 w-8 text-[#ed6e2b]" />
                </div>

                <h2 className="text-base font-extrabold text-slate-800">
                  کاربری انتخاب نشده است
                </h2>

                <p className="mt-2 max-w-sm text-xs leading-6 text-slate-400">
                  برای مدیریت دسترسی‌ها، ابتدا یک کاربر را از لیست
                  پرسنل انتخاب کنید.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
