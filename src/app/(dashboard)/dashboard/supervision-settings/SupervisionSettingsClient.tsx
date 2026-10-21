"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignSupervisorAction, removeSupervisorAction } from "@/actions/supervision";
import {
  Network, Crown, Users, UserCircle2, ChevronDown, ChevronLeft, ChevronUp,
  Link2, Unlink, AlertCircle, CheckCircle, Search, Layers,
} from "lucide-react";

const fa = (n: number) => n.toLocaleString("fa-IR");

interface TreeNode {
  Personnel_ID: number;
  Full_Name: string;
  Personal_Image_Path?: string | null;
  OrganizationalPosition?: { Name: string } | null;
  supervisorName?: string;
  children: TreeNode[];
}

export default function SupervisionSettingsClient({ data }: { data: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleNode = (id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ---------- تخصیص ----------
  const handleAssign = (personnelId: number, supervisorId: string) => {
    const fd = new FormData();
    fd.append("personnelId", String(personnelId));

    startTransition(async () => {
      if (supervisorId === "") {
        // بازگشت به زیرمجموعه مستقیم مدیرعامل
        fd.delete("supervisorId");
        const res: any = await removeSupervisorAction(fd);
        if (res?.error) showToast(res.error, "error");
        else {
          showToast("سرپرست حذف شد — زیرمجموعه مستقیم مدیرعامل شد");
          router.refresh();
        }
      } else {
        fd.append("supervisorId", supervisorId);
        const res: any = await assignSupervisorAction(fd);
        if (res?.error) showToast(res.error, "error");
        else {
          showToast("سرپرست با موفقیت تعیین شد");
          router.refresh();
        }
      }
    });
  };

  // ---------- فیلتر لیست ----------
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.list;
    return data.list.filter(
      (p: any) =>
        p.Full_Name?.toLowerCase().includes(q) ||
        (p.Personnel_Code || "").toLowerCase().includes(q)
    );
  }, [data.list, search]);

  const eligibleSupervisors = (personId: number) =>
    data.list.filter((p: any) => p.Personnel_ID !== personId);

  // ============================================================
  //  رندر بازگشتی درخت
  // ============================================================
  const TreeNodeView = ({ node, depth }: { node: TreeNode; depth: number }) => {
    const isCollapsed = collapsed.has(node.Personnel_ID);
    const childCount = node.children?.length || 0;

    return (
      <div className={depth > 0 ? "mr-5 border-r-2 border-orange-100 pr-4" : ""}>
        <div className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 my-1.5 transition-all hover:border-orange-200 hover:bg-orange-50/30">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
            {node.Personal_Image_Path ? (
              <img src={node.Personal_Image_Path} alt={node.Full_Name} className="h-full w-full object-cover" />
            ) : (
              <UserCircle2 className="h-6 w-6 text-slate-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-800">{node.Full_Name}</p>
            <p className="truncate text-[11px] text-slate-400">
              {node.OrganizationalPosition?.Name || "بدون جایگاه"}
              {node.supervisorName && depth > 0 && <span className="mr-2">| سرپرست: {node.supervisorName}</span>}
            </p>
          </div>
          {childCount > 0 && (
            <span className="flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-[10px] font-bold text-[#ed6e2b]">
              <Users className="h-3 w-3" /> {fa(childCount)} نفر
            </span>
          )}
          {childCount > 0 && (
            <button
              type="button"
              onClick={() => toggleNode(node.Personnel_ID)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
              title={isCollapsed ? "نمایش زیرمجموعه‌ها" : "بستن"}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          )}
        </div>

        {!isCollapsed && node.children?.map((child) => (
          <TreeNodeView key={child.Personnel_ID} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1400px]">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
              <Network className="h-5 w-5 text-[#ed6e2b]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">تنظیمات سرپرستی</h1>
              <p className="mt-1 text-xs text-slate-500">
                تعیین سرپرست مستقیم هر پرسنل — درخواست‌ها به سرپرست مستقیم ارسال می‌شود
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "کل پرسنل", value: data.stats.totalSubordinates, color: "#0f172a" },
              { label: "دارای سرپرست", value: data.stats.assigned, color: "#16a34a" },
              { label: "زیرمجموعه CEO", value: data.stats.directToCeo, color: "#d97706" },
              { label: "سرپرست‌ها", value: data.stats.supervisorsCount, color: "#1d4ed8" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
                <p className="text-lg font-extrabold" style={{ color: s.color }}>{fa(s.value)}</p>
                <p className="text-[10px] text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {!data.ceo && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            پرسنلی با نقش مدیرعامل (CEO) یافت نشد — درخت بدون ریشه نمایش داده می‌شود.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">

          {/* ===== درخت سرپرستی ===== */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                  <Layers className="h-5 w-5 text-[#ed6e2b]" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">نمودار درختی سرپرستی</h2>
                  <p className="mt-1 text-[11px] text-slate-400">ساختار سلسله‌مراتب سازمان</p>
                </div>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4">
              {/* ریشه CEO */}
              {data.ceo && (
                <div className="mb-3 flex items-center gap-3 rounded-xl border-2 border-amber-300 bg-gradient-to-l from-amber-50 to-white px-4 py-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-100">
                    {data.ceo.Personal_Image_Path ? (
                      <img src={data.ceo.Personal_Image_Path} alt={data.ceo.Full_Name} className="h-full w-full object-cover" />
                    ) : (
                      <Crown className="h-6 w-6 text-amber-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-extrabold text-slate-900">
                      {data.ceo.Full_Name}
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">👑 مدیرعامل</span>
                    </p>
                    <p className="truncate text-[11px] text-slate-400">{data.ceo.OrganizationalPosition?.Name || "-"}</p>
                  </div>
                </div>
              )}

              {data.tree.map((node: TreeNode) => (
                <TreeNodeView key={node.Personnel_ID} node={node} depth={1} />
              ))}

              {data.tree.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                  <Network className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-xs font-medium text-slate-400">
                    هنوز هیچ تخصیصی انجام نشده — همه زیرمجموعه مستقیم مدیرعامل هستند
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ===== پنل تخصیص سرپرست ===== */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                    <Link2 className="h-5 w-5 text-[#ed6e2b]" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">تعیین سرپرست پرسنل</h2>
                    <p className="mt-1 text-[11px] text-slate-400">از منوی هر نفر، سرپرست مستقیم او را انتخاب کنید</p>
                  </div>
                </div>
                <div className="relative sm:w-56">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="جستجو..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 text-sm outline-none transition focus:border-[#ed6e2b] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>
            </div>

            <div className="max-h-[70vh] space-y-2 overflow-y-auto p-4">
              {filteredList.map((p: any) => (
                <div
                  key={p.Personnel_ID}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 transition-all hover:border-orange-100 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                      {p.Personal_Image_Path ? (
                        <img src={p.Personal_Image_Path} alt={p.Full_Name} className="h-full w-full object-cover" />
                      ) : (
                        <UserCircle2 className="h-6 w-6 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{p.Full_Name}</p>
                      <p className="truncate text-[10px] text-slate-400">
                        {p.OrganizationalPosition?.Name || "بدون جایگاه"}
                        {p.subordinatesCount > 0 && (
                          <span className="mr-2 font-bold text-[#ed6e2b]">({fa(p.subordinatesCount)} زیرمجموعه)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`hidden rounded-lg px-2 py-1 text-[10px] font-bold md:inline ${
                        p.supervisorId
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {p.supervisorName}
                    </span>

                    <select
                      value={p.supervisorId ?? ""}
                      disabled={isPending}
                      onChange={(e) => handleAssign(p.Personnel_ID, e.target.value)}
                      className="h-9 w-full min-w-[170px] rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none transition focus:border-[#ed6e2b] focus:ring-4 focus:ring-orange-100 disabled:opacity-60 sm:w-auto"
                    >
                      <option value="">— زیرمجموعه مستقیم مدیرعامل —</option>
                      {eligibleSupervisors(p.Personnel_ID).map((s: any) => (
                        <option key={s.Personnel_ID} value={s.Personnel_ID}>
                          {s.Full_Name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              {filteredList.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                  <Search className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-xs font-medium text-slate-400">پرسنلی با این مشخصات یافت نشد</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
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