"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Clock, X, TrendingUp, MessageSquare, FileSpreadsheet, ChevronRight, ChevronLeft } from "lucide-react";

const PAGE_SIZE = 15;

const toPersianDate = (date: Date | string) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fa-IR");
};

const toPersianTime = (timeStr: Date | string) => {
  if (!timeStr) return "-";
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
};

// ============================================================
//  ✅ رنگ‌بندی ضریب مدیر
//  null → خاکستری (در انتظار بررسی) | ۱۰۰ → سبز | ۷۵+ → کهربایی
//  ۵۰+ → نارنجی | زیر ۵۰ → قرمز
// ============================================================
const getScoreUI = (score: number | null | undefined) => {
  if (score === null || score === undefined) {
    return { color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0", text: "در انتظار بررسی" };
  }
  const s = Number(score);
  if (s >= 100) return { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", text: `${s}٪` };
  if (s >= 75)  return { color: "#d97706", bg: "#fffbeb", border: "#fde68a", text: `${s}٪` };
  if (s >= 50)  return { color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", text: `${s}٪` };
  return { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", text: `${s}٪` };
};

// برچسب متنی ضریب برای خروجی اکسل
const getScoreLabel = (score: number | null | undefined) => {
  if (score === null || score === undefined) return "در انتظار بررسی";
  const s = Number(score);
  if (s >= 100) return "تایید کامل";
  if (s >= 75)  return "تایید با کسر جزئی";
  if (s >= 50)  return "کسر قابل توجه";
  return "کسر شدید";
};

export default function ActivitiesClient({ data, period }: { data: any; period: string }) {
  const router = useRouter();
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const rawReports = data.rawReports || [];
  const summary = data.summary || {};

  // ریست صفحه هنگام تغییر بازه (چون کامپوننت مونت می‌ماند)
  useEffect(() => { setPage(1); }, [period]);

  const totalPages = Math.max(1, Math.ceil(rawReports.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = rawReports.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ---------- خروجی اکسل (کل گزارش‌های بازه — نه فقط صفحه فعلی) ----------
  const handleExportExcel = async () => {
    if (rawReports.length === 0) return;
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");
      const rows = rawReports.map((r: any, i: number) => {
        const actual = Number(r.Work_Hours || 0);
        const score = Number(r.Manager_Score ?? 100);
        return {
          "ردیف": i + 1,
          "تاریخ": toPersianDate(r.Report_Date),
          "نوع فعالیت": r.PR_Work_Types?.Work_Type_Name || "فعالیت عمومی",
          "پروژه": r.PR_Projects?.Project_Name || "-",
          "ورود": r.Check_In ? toPersianTime(r.Check_In) : "-",
          "خروج": r.Check_Out ? toPersianTime(r.Check_Out) : "در حال انجام",
          "ساعت واقعی": actual,
          "ضریب مدیر (٪)": r.Manager_Score == null ? "-" : score,
          "وضعیت ضریب": getScoreLabel(r.Manager_Score),
          "ساعت موثر": Number((actual * (score / 100)).toFixed(2)),
          "شرح کار": r.Work_Description || "",
          "نظر مدیر": r.Manager_Comment || "",
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 6 }, { wch: 13 }, { wch: 22 }, { wch: 18 }, { wch: 9 }, { wch: 12 },
        { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 45 }, { wch: 40 },
      ];
      const wb = XLSX.utils.book_new();
      wb.Workbook = { Views: [{ RTL: true }] }; // راست‌به‌چپ در اکسل
      XLSX.utils.book_append_sheet(wb, ws, "ریز فعالیت‌ها");
      XLSX.writeFile(wb, `Activities-${period}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0",
    padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  };

  return (
    <div dir="rtl" style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>

      {/* هدر صفحه + دکمه اکسل */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => router.push(`/dashboard/my-work-hours/period?period=${period}`)} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px", cursor: "pointer", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowRight style={{ width: "20px", height: "20px", color: "#64748b" }} />
          </button>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "bold", color: "#0f172a" }}>ریز فعالیت‌ها: {summary.periodLabel}</h1>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={isExporting || rawReports.length === 0}
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px",
            background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
            color: "white", border: "none", borderRadius: "10px", cursor: rawReports.length === 0 ? "not-allowed" : "pointer",
            fontWeight: "bold", fontSize: "13px", boxShadow: "0 4px 6px -1px rgba(22,163,74,0.2)", opacity: isExporting ? 0.7 : 1,
          }}
        >
          <FileSpreadsheet style={{ width: "18px", height: "18px" }} />
          {isExporting ? "در حال آماده‌سازی..." : "خروجی اکسل"}
        </button>
      </div>

      {/* لیست فعالیت‌ها */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText style={{ width: "20px", height: "20px", color: "#ed6e2b" }} />
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>لیست تمام فعالیت‌های ثبت شده</h2>
          </div>
          {rawReports.length > 0 && (
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {rawReports.length.toLocaleString("fa-IR")} فعالیت | جمع موثر: {Number(summary.totalEffectiveHours || 0).toLocaleString("fa-IR")} ساعت
            </span>
          )}
        </div>

        {pageItems.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {pageItems.map((r: any, index: number) => {
              const actualHours = Number(r.Work_Hours || 0);
              const managerScore = Number(r.Manager_Score ?? 100);
              const effectiveHours = actualHours * (managerScore / 100);
              const scoreUI = getScoreUI(r.Manager_Score); // ✅ رنگ ضریب

              return (
                <div
                  key={r.Report_ID || index}
                  onClick={() => setSelectedActivity(r)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px", backgroundColor: "#f8fafc", borderRadius: "10px",
                    cursor: "pointer", border: "1px solid #f1f5f9", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fffbf5"; e.currentTarget.style.borderColor = "#fed7aa"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; e.currentTarget.style.borderColor = "#f1f5f9"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Clock style={{ width: "18px", height: "18px", color: "#ed6e2b" }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>{r.PR_Work_Types?.Work_Type_Name || "فعالیت عمومی"}</p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                        {toPersianDate(r.Report_Date)} | {toPersianTime(r.Check_In)} تا {r.Check_Out ? toPersianTime(r.Check_Out) : "در حال انجام"}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#c2410c", backgroundColor: "white", padding: "6px 12px", borderRadius: "8px", border: "1px solid #fed7aa" }}>
                      موثر: {effectiveHours.toFixed(2)} ساعت
                    </span>
                    {/* ✅ ضریب رنگی */}
                    <span style={{ fontSize: "10px", color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      واقعی: {actualHours.toFixed(2)} |
                      <span style={{
                        fontWeight: 700, fontSize: "10px", padding: "2px 8px", borderRadius: "6px",
                        color: scoreUI.color, backgroundColor: scoreUI.bg, border: `1px solid ${scoreUI.border}`,
                      }}>
                        ضریب: {scoreUI.text}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>فعالیتی در این بازه ثبت نشده است.</p>
        )}

        {/* ===== صفحه‌بندی ===== */}
        {rawReports.length > PAGE_SIZE && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              صفحه {safePage.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")} — نمایش {pageItems.length.toLocaleString("fa-IR")} از {rawReports.length.toLocaleString("fa-IR")} فعالیت
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1}
                style={{ padding: "8px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", cursor: safePage === 1 ? "not-allowed" : "pointer", opacity: safePage === 1 ? 0.4 : 1, display: "flex" }}>
                <ChevronRight style={{ width: "16px", height: "16px", color: "#475569" }} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ width: "34px", height: "34px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "13px", backgroundColor: p === safePage ? "#ed6e2b" : "#f1f5f9", color: p === safePage ? "white" : "#64748b" }}>
                  {p.toLocaleString("fa-IR")}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages}
                style={{ padding: "8px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", cursor: safePage === totalPages ? "not-allowed" : "pointer", opacity: safePage === totalPages ? 0.4 : 1, display: "flex" }}>
                <ChevronLeft style={{ width: "16px", height: "16px", color: "#475569" }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* مودال جزئیات */}
      {selectedActivity && (() => {
        const scoreUI = getScoreUI(selectedActivity.Manager_Score); // ✅ رنگ ضریب در مودال

        return (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} onClick={() => setSelectedActivity(null)}>
            <div style={{ backgroundColor: "white", borderRadius: "16px", width: "100%", maxWidth: "500px", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", maxHeight: "calc(100vh - 32px)", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileText style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /> جزئیات فعالیت
                </h2>
                <button onClick={() => setSelectedActivity(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#64748b" }}>
                  <X style={{ width: "24px", height: "24px" }} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>نوع فعالیت</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "15px", fontWeight: "bold", color: "#0f172a" }}>{selectedActivity.PR_Work_Types?.Work_Type_Name || "فعالیت عمومی"}</p>
                </div>

                {selectedActivity.PR_Projects && (
                  <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>پروژه</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{selectedActivity.PR_Projects.Project_Name}</p>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>تاریخ</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{toPersianDate(selectedActivity.Report_Date)}</p>
                  </div>
                  <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>ساعت ورود</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{selectedActivity.Check_In ? toPersianTime(selectedActivity.Check_In) : "-"}</p>
                  </div>
                  <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>ساعت خروج</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{selectedActivity.Check_Out ? toPersianTime(selectedActivity.Check_Out) : "در حال انجام"}</p>
                  </div>
                  <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>زمان واقعی</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: "600", color: "#475569" }}>{Number(selectedActivity.Work_Hours || 0).toFixed(2)} ساعت</p>
                  </div>
                </div>

                {/* ✅ باکس ضریب رنگی + ساعت موثر */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ backgroundColor: scoreUI.bg, padding: "12px", borderRadius: "10px", border: `1px solid ${scoreUI.border}` }}>
                    <p style={{ margin: 0, fontSize: "12px", color: scoreUI.color, display: "flex", alignItems: "center", gap: "4px" }}>
                      <TrendingUp style={{ width: "14px", height: "14px" }} /> ضریب تایید مدیر
                    </p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "15px", fontWeight: "700", color: scoreUI.color }}>{scoreUI.text}</p>
                  </div>
                  <div style={{ backgroundColor: "#fffbeb", padding: "12px", borderRadius: "10px", border: "1px solid #fde68a" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#92400e" }}>ساعت موثر (محاسبه شده)</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "15px", fontWeight: "700", color: "#d97706" }}>
                      {(Number(selectedActivity.Work_Hours || 0) * (Number(selectedActivity.Manager_Score ?? 100) / 100)).toFixed(2)} ساعت
                    </p>
                  </div>
                </div>

                {selectedActivity.Manager_Comment && (
                  <div style={{ backgroundColor: "#eff6ff", padding: "16px", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#1d4ed8", marginBottom: "6px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                      <MessageSquare style={{ width: "14px", height: "14px" }} /> نظر مدیر
                    </p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#334155", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{selectedActivity.Manager_Comment}</p>
                  </div>
                )}

                {selectedActivity.Work_Description && (
                  <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: "600" }}>شرح کار انجام شده:</p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#334155", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{selectedActivity.Work_Description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}