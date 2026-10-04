"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Clock, X, TrendingUp, MessageSquare } from "lucide-react";

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

export default function ActivitiesClient({ data, period }: { data: any, period: string }) {
  const router = useRouter();
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  
  const rawReports = data.rawReports || [];
  const summary = data.summary || {};

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0",
    padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  };

  return (
    <div dir="rtl" style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>

      {/* هدر صفحه */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <button onClick={() => router.push(`/dashboard/my-work-hours/period?period=${period}`)} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px", cursor: "pointer", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowRight style={{ width: "20px", height: "20px", color: "#64748b" }} />
        </button>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "bold", color: "#0f172a" }}>ریز فعالیت‌ها: {summary.periodLabel}</h1>
      </div>

      {/* لیست فعالیت‌ها */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
          <FileText style={{ width: "20px", height: "20px", color: "#ed6e2b" }} />
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>لیست تمام فعالیت‌های ثبت شده</h2>
        </div>

        {rawReports.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {rawReports.map((r: any, index: number) => {
              const actualHours = Number(r.Work_Hours || 0);
              const managerScore = Number(r.Manager_Score || 100);
              const effectiveHours = actualHours * (managerScore / 100);
              
              return (
                <div 
                  key={index} 
                  onClick={() => setSelectedActivity(r)}
                  style={{ 
                    display: "flex", justifyContent: "space-between", alignItems: "center", 
                    padding: "14px", backgroundColor: "#f8fafc", borderRadius: "10px", 
                    cursor: "pointer", border: "1px solid #f1f5f9", transition: "all 0.2s" 
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
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>{toPersianDate(r.Report_Date)} | {toPersianTime(r.Check_In)} تا {toPersianTime(r.Check_Out) || "در حال انجام"}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#c2410c", backgroundColor: "white", padding: "6px 12px", borderRadius: "8px", border: "1px solid #fed7aa" }}>
                      موثر: {effectiveHours.toFixed(2)} ساعت
                    </span>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                      واقعی: {actualHours.toFixed(2)} | ضریب: {managerScore}٪
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>فعالیتی در این بازه ثبت نشده است.</p>
        )}
      </div>

      {/* مودال جزئیات فعالیت */}
      {selectedActivity && (
        <div 
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} 
          onClick={() => setSelectedActivity(null)}
        >
          <div 
            style={{ backgroundColor: "white", borderRadius: "16px", width: "100%", maxWidth: "500px", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }} 
            onClick={(e) => e.stopPropagation()}
          >
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>تاریخ</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{toPersianDate(selectedActivity.Report_Date)}</p>
                </div>
                <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>ساعت ورود</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{toPersianTime(selectedActivity.Check_In) || "-"}</p>
                </div>
                <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>ساعت خروج</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{toPersianTime(selectedActivity.Check_Out) || "در حال انجام"}</p>
                </div>
                <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>زمان واقعی</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", fontWeight: "600", color: "#475569" }}>{Number(selectedActivity.Work_Hours || 0).toFixed(2)} ساعت</p>
                </div>
              </div>

              {/* بخش ضریب مدیر و ساعت موثر */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ backgroundColor: "#fff7ed", padding: "12px", borderRadius: "10px", border: "1px solid #fed7aa" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#c2410c", display: "flex", alignItems: "center", gap: "4px" }}>
                    <TrendingUp style={{ width: "14px", height: "14px" }} /> ضریب تایید مدیر
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "15px", fontWeight: "700", color: "#c2410c" }}>{Number(selectedActivity.Manager_Score || 100)}٪</p>
                </div>
                <div style={{ backgroundColor: "#fffbeb", padding: "12px", borderRadius: "10px", border: "1px solid #fde68a" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#92400e" }}>ساعت موثر (محاسبه شده)</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "15px", fontWeight: "700", color: "#d97706" }}>
                    {(Number(selectedActivity.Work_Hours || 0) * (Number(selectedActivity.Manager_Score || 100) / 100)).toFixed(2)} ساعت
                  </p>
                </div>
              </div>

              {/* بخش نظر مدیر */}
              {selectedActivity.Manager_Comment && (
                <div style={{ backgroundColor: "#eff6ff", padding: "16px", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#1d4ed8", marginBottom: "6px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                    <MessageSquare style={{ width: "14px", height: "14px" }} /> نظر مدیر
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#334155", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{selectedActivity.Manager_Comment}</p>
                </div>
              )}

              {/* بخش توضیحات کارمند */}
              {selectedActivity.Work_Description && (
                <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b", marginBottom: "6px", fontWeight: "600" }}>شرح کار انجام شده:</p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#334155", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{selectedActivity.Work_Description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}