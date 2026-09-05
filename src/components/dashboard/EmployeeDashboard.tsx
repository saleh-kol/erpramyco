"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Calendar, Navigation, Wallet, Briefcase, Bell, Play, TrendingUp, CheckCircle, Lock } from "lucide-react";

const toPersianTime = (timeStr: Date | string) => {
  if (!timeStr) return "-";
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
};

export default function EmployeeDashboard({ data, user }: { data: any, user: any }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  // بررسی تاریخ برای دسترسی به فیش حقوقی
  const today = new Date();
  const isReportAvailable = today.getDate() >= 1 && today.getDate() <= 3;

  const handlePayslipClick = () => {
    if (isReportAvailable) {
      router.push("/dashboard/my-work-hours/monthly-report");
    } else {
      setToast("دسترسی به گزارش ماه گذشته فقط از ۱ تا ۳ام هر ماه امکان‌پذیر است.");
      setTimeout(() => setToast(null), 3500);
    }
  };

  const hoursPercent = data.maxMonthlyHours > 0 ? Math.min(100, (data.currentMonthHours / data.maxMonthlyHours) * 100) : 0;

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0",
    padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.3s"
  };

  const quickActionStyle: React.CSSProperties = {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: "12px", padding: "20px", borderRadius: "16px",
    backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", transition: "all 0.2s"
  };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "calc(100vh - 128px)", padding: "24px" }}>
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>

      {/* خوش آمدگویی */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "bold", color: "#0f172a" }}>{user.name} ,خوش آمدید</h1>
        <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#64748b" }}>امیدواریم روز کاری خوبی داشته باشید. از اینجا می‌توانید فعالیت‌های خود را مدیریت کنید.</p>
      </div>

      {/* بخش دسترسی سریع (Quick Actions) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "32px" }}>
        
        {/* ثبت فعالیت */}
        <div style={{ ...quickActionStyle, cursor: "pointer" }} onClick={() => router.push("/dashboard/attendance")} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff7ed"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}>
          <div style={{ backgroundColor: "#ed6e2b", padding: "12px", borderRadius: "12px" }}><Play style={{ width: "24px", height: "24px", color: "white" }} /></div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>ثبت فعالیت</span>
        </div>

        {/* درخواست مرخصی */}
        <div style={{ ...quickActionStyle, cursor: "pointer" }} onClick={() => router.push("/dashboard/leave")} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff7ed"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}>
          <div style={{ backgroundColor: "#3b82f6", padding: "12px", borderRadius: "12px" }}><Calendar style={{ width: "24px", height: "24px", color: "white" }} /></div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>درخواست مرخصی</span>
        </div>

        {/* ثبت ماموریت */}
        <div style={{ ...quickActionStyle, cursor: "pointer" }} onClick={() => router.push("/dashboard/my-missions")} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff7ed"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}>
          <div style={{ backgroundColor: "#ef4444", padding: "12px", borderRadius: "12px" }}><Navigation style={{ width: "24px", height: "24px", color: "white" }} /></div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>ثبت ماموریت</span>
        </div>

        {/* فیش حقوقی (شرطی) */}
        <div 
          style={{ ...quickActionStyle, cursor: isReportAvailable ? "pointer" : "not-allowed", opacity: isReportAvailable ? 1 : 0.6 }} 
          onClick={handlePayslipClick} 
          onMouseEnter={(e) => { if(isReportAvailable) e.currentTarget.style.backgroundColor = "#fff7ed" }} 
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
        >
          <div style={{ backgroundColor: isReportAvailable ? "#16a34a" : "#cbd5e1", padding: "12px", borderRadius: "12px", position: "relative" }}>
            <Wallet style={{ width: "24px", height: "24px", color: "white" }} />
            {!isReportAvailable && <Lock style={{ position: "absolute", bottom: "-4px", right: "-4px", width: "16px", height: "16px", color: "#64748b", backgroundColor: "white", borderRadius: "50%" }} />}
          </div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>فیش حقوقی</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* ستون راست: وضعیت کارکرد و پروژه‌ها */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* کارت وضعیت کارکرد ماهانه */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <TrendingUp style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /> وضعیت کارکرد ماه جاری
              </h2>
              <span style={{ fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>{data.currentMonthHours} / {data.maxMonthlyHours} ساعت</span>
            </div>
            <div style={{ width: "100%", height: "12px", backgroundColor: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ width: `${hoursPercent}%`, height: "100%", background: "linear-gradient(90deg, #ed6e2b, #ea580c)", borderRadius: "10px", transition: "width 1s ease-in-out" }}></div>
            </div>
          </div>

          {/* کارت پروژه‌های در دست انجام */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <Briefcase style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /> پروژه‌های در دست انجام
              </h2>
              <button onClick={() => router.push("/dashboard/my-projects")} style={{ fontSize: "13px", color: "#ed6e2b", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>مشاهده همه</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.activeProjects.length > 0 ? (
                data.activeProjects.map((p: any) => (
                  <div key={p.Project_ID} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>{p.Project_Name}</span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>مهلت: {new Date(p.End_Date).toLocaleDateString("fa-IR")}</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center" }}>شما در حال حاضر پروژه فعالی ندارید.</p>
              )}
            </div>
          </div>
        </div>

        {/* ستون چپ: ابلاغیه‌ها و فعالیت امروز */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* کارت فعالیت امروز */}
          <div style={cardStyle}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /> فعالیت امروز
            </h2>
            {data.todayActivity ? (
              <div style={{ backgroundColor: "#f0fdf4", padding: "16px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#166534" }}>ساعت ورود:</span>
                  <span style={{ fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>{toPersianTime(data.todayActivity.Check_In)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#166534" }}>ساعت خروج:</span>
                  <span style={{ fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>{data.todayActivity.Check_Out ? toPersianTime(data.todayActivity.Check_Out) : "در حال انجام"}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "16px" }}>فعالیتی برای امروز ثبت نشده است.</p>
                <button onClick={() => router.push("/dashboard/attendance")} style={{ backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>شروع فعالیت</button>
              </div>
            )}
          </div>

          {/* کارت ابلاغیه‌های من */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <Bell style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /> ابلاغیه‌ها
              </h2>
              {data.pendingTasksCount > 0 && <span style={{ backgroundColor: "#ef4444", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold" }}>{data.pendingTasksCount}</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.pendingTasks.length > 0 ? (
                data.pendingTasks.map((t: any) => (
                  <div key={t.Task_ID} style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
                    <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{t.Title}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>اولویت: {t.Priority}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "14px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <CheckCircle style={{ width: "32px", height: "32px", color: "#16a34a" }} />
                  ابلاغیه جدیدی ندارید.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* نوتیفیکیشن پیام قفل فیش حقوقی */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, animation: 'slideUp 0.3s ease-out' }}>
          <Lock style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
          {toast}
        </div>
      )}
    </div>
  );
}