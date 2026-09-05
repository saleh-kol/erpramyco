"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Wallet, Clock, Calendar, Settings, FileText, ChevronLeft } from "lucide-react";

const formatRial = (val: number) => val.toLocaleString('fa-IR');

export default function FinanceDashboard({ data, user }: { data: any, user: any }) {
  const router = useRouter();

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0",
    padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
  };

  const quickActionStyle: React.CSSProperties = {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: "12px", padding: "20px", borderRadius: "16px", cursor: "pointer",
    backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", transition: "all 0.2s"
  };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "calc(100vh - 128px)", padding: "24px" }}>
      
      {/* خوش آمدگویی */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "bold", color: "#0f172a" }}>{user.name} ,خوش آمدید</h1>
        <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#64748b" }}>نمای کلی وضعیت مالی، حقوق و دستمزد و هزینه‌های پروژه‌ها.</p>
      </div>

      {/* هشدار بحرانی: پرسنل بدون حقوق پایه */}
      {data.missingSalaryCount > 0 && (
        <div 
          onClick={() => router.push("/dashboard/payroll-settings")} 
          style={{ 
            backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "16px", 
            padding: "20px 24px", marginBottom: "32px", display: "flex", alignItems: "center", 
            justifyContent: "space-between", cursor: "pointer", boxShadow: "0 4px 6px rgba(239, 68, 68, 0.1)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ backgroundColor: "#ef4444", padding: "12px", borderRadius: "12px" }}>
              <AlertTriangle style={{ width: "24px", height: "24px", color: "white" }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#991b1b" }}>هشدار: نقص در تنظیمات مالی!</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#b91c1c" }}>
                برای {data.missingSalaryCount} نفر از پرسنل، حقوق پایه یا نرخ ساعتی تنظیم نشده است.
              </p>
            </div>
          </div>
          <ChevronLeft style={{ width: "24px", height: "24px", color: "#ef4444" }} />
        </div>
      )}

      {/* بخش دسترسی سریع (Quick Actions) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "32px" }}>
        <div style={quickActionStyle} onClick={() => router.push("/dashboard/payroll-settings")} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff7ed"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}>
          <div style={{ backgroundColor: "#ed6e2b", padding: "12px", borderRadius: "12px" }}><Wallet style={{ width: "24px", height: "24px", color: "white" }} /></div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>تنظیمات حقوق و دستمزد</span>
        </div>
        <div style={quickActionStyle} onClick={() => router.push("/dashboard/calendar")} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff7ed"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}>
          <div style={{ backgroundColor: "#3b82f6", padding: "12px", borderRadius: "12px" }}><Calendar style={{ width: "24px", height: "24px", color: "white" }} /></div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>تقویم کاری</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* ستون راست: آمار مالی */}
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /> آمار مالی ماه گذشته
          </h2>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", backgroundColor: "#f0fdf4", borderRadius: "12px", marginBottom: "16px", border: "1px solid #bbf7d0" }}>
            <div>
              <span style={{ fontSize: "14px", color: "#166534", fontWeight: 600 }}>مجموع پاداش پروژه‌های تکمیل شده</span>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#15803d" }}>{data.bonusProjectCount} پروژه با موفقیت به پایان رسید</p>
            </div>
            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#166534" }}>{formatRial(data.totalBonuses)} <span style={{ fontSize: "14px" }}>ریال</span></span>
          </div>
        </div>

        {/* ستون چپ: لیست پرسنل نیازمند تنظیمات */}
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>پرسنل نیازمند تنظیم حقوق</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.missingSalaryList.length > 0 ? (
              data.missingSalaryList.map((p: any) => (
                <div key={p.Personnel_ID} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
                  <div style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "6px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold" }}>
                    بدون حقوق
                  </div>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#334155", display: "block" }}>{p.Full_Name}</span>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>{p.Personnel_Code}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "14px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "20px" }}>
                <Settings style={{ width: "32px", height: "32px", color: "#16a34a" }} />
                تنظیمات مالی همه پرسنل تکمیل است.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}