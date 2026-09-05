"use client";

import { useRouter } from "next/navigation";
import { Calendar, Briefcase, Navigation, Users, Clock, AlertCircle, ChevronLeft } from "lucide-react";

const toPersianDate = (date: Date | string) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fa-IR");
};

export default function ManagerDashboard({ data, user }: { data: any, user: any }) {
  const router = useRouter();

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white", borderRadius: "20px", border: "1px solid #e2e8f0",
    padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
  };

  const approvalCardStyle = (count: number): React.CSSProperties => ({
    ...cardStyle,
    cursor: "pointer",
    borderColor: count > 0 ? "#fed7aa" : "#e2e8f0",
    backgroundColor: count > 0 ? "#fff7ed" : "white",
    transition: "all 0.2s"
  });

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "calc(100vh - 128px)", padding: "24px" }}>
      
      {/* خوش آمدگویی */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "bold", color: "#0f172a" }}>{user.name} ,خوش آمدید</h1>
        <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#64748b" }}>نمای کلی وضعیت کارخانه و درخواست‌های در انتظار تصمیم شما.</p>
      </div>

      {/* بخش تاییدات در انتظار (مهم‌ترین بخش) */}
      <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#334155", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <AlertCircle style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /> درخواست‌های در انتظار تایید
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "32px" }}>
        
        {/* کارت مرخصی‌ها */}
        <div style={approvalCardStyle(data.pendingApprovals.leaves)} onClick={() => router.push("/dashboard/leave-approvals")} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ backgroundColor: "#3b82f6", padding: "10px", borderRadius: "12px" }}><Calendar style={{ width: "24px", height: "24px", color: "white" }} /></div>
            {data.pendingApprovals.leaves > 0 && <span style={{ backgroundColor: "#ef4444", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold" }}>{data.pendingApprovals.leaves}</span>}
          </div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>درخواست مرخصی</h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: data.pendingApprovals.leaves > 0 ? "#c2410c" : "#94a3b8" }}>{data.pendingApprovals.leaves > 0 ? "نیازمند بررسی فوری" : "درخواستی وجود ندارد"}</p>
        </div>

        {/* کارت پروژه‌ها */}
        <div style={approvalCardStyle(data.pendingApprovals.projects)} onClick={() => router.push("/dashboard/leave-approvals")} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ backgroundColor: "#ed6e2b", padding: "10px", borderRadius: "12px" }}><Briefcase style={{ width: "24px", height: "24px", color: "white" }} /></div>
            {data.pendingApprovals.projects > 0 && <span style={{ backgroundColor: "#ef4444", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold" }}>{data.pendingApprovals.projects}</span>}
          </div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>اتمام پروژه</h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: data.pendingApprovals.projects > 0 ? "#c2410c" : "#94a3b8" }}>{data.pendingApprovals.projects > 0 ? "نیازمند بررسی فوری" : "درخواستی وجود ندارد"}</p>
        </div>

        {/* کارت ماموریت‌ها */}
        <div style={approvalCardStyle(data.pendingApprovals.missions)} onClick={() => router.push("/dashboard/leave-approvals")} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ backgroundColor: "#ef4444", padding: "10px", borderRadius: "12px" }}><Navigation style={{ width: "24px", height: "24px", color: "white" }} /></div>
            {data.pendingApprovals.missions > 0 && <span style={{ backgroundColor: "#ef4444", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold" }}>{data.pendingApprovals.missions}</span>}
          </div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>درخواست ماموریت</h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: data.pendingApprovals.missions > 0 ? "#c2410c" : "#94a3b8" }}>{data.pendingApprovals.missions > 0 ? "نیازمند بررسی فوری" : "درخواستی وجود ندارد"}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* ستون راست: پروژه‌ها و آخرین فعالیت‌ها */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* کارت پروژه‌های در دست انجام */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>پروژه‌های در دست انجام</h2>
              <button onClick={() => router.push("/dashboard/projects")} style={{ fontSize: "13px", color: "#ed6e2b", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>مشاهده همه</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.activeProjects.length > 0 ? (
                data.activeProjects.map((p: any) => (
                  <div key={p.Project_ID} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
                    <div>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#334155", display: "block" }}>{p.Project_Name}</span>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>👑 {p.Project_Leader?.Full_Name || "تعیین نشده"}</span>
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>مهلت پایان:</span>
                      <span style={{ fontSize: "13px", fontWeight: "bold", color: "#0f172a" }}>{toPersianDate(p.End_Date)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center" }}>پروژه فعالی وجود ندارد.</p>
              )}
            </div>
          </div>

          {/* کارت آخرین فعالیت‌های ثبت شده */}
          <div style={cardStyle}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>آخرین فعالیت‌های ثبت شده</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.recentReports.length > 0 ? (
                data.recentReports.map((r: any) => (
                  <div key={r.Report_ID} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "10px" }}>
                    <div style={{ backgroundColor: "#e2e8f0", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontWeight: "bold", fontSize: "14px" }}>
                      {r.Personnel?.Full_Name?.charAt(0) || "?"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", display: "block" }}>{r.Personnel?.Full_Name || "ناشناخته"}</span>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>ثبت فعالیت برای {toPersianDate(r.Report_Date)}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "bold" }}>{Number(r.Work_Hours || 0).toFixed(1)} ساعت</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center" }}>فعالیتی ثبت نشده است.</p>
              )}
            </div>
          </div>
        </div>

        {/* ستون چپ: آمار سریع */}
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>آمار سریع</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ backgroundColor: "#eff6ff", padding: "8px", borderRadius: "10px" }}><Users style={{ width: "20px", height: "20px", color: "#3b82f6" }} /></div>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>پرسنل فعال</span>
              </div>
              <span style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>{data.stats.activePersonnel}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ backgroundColor: "#fff7ed", padding: "8px", borderRadius: "10px" }}><Briefcase style={{ width: "20px", height: "20px", color: "#ed6e2b" }} /></div>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>پروژه‌های فعال</span>
              </div>
              <span style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>{data.stats.totalProjects}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ backgroundColor: "#fef2f2", padding: "8px", borderRadius: "10px" }}><Clock style={{ width: "20px", height: "20px", color: "#ef4444" }} /></div>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>ابلاغیه‌های صادر شده</span>
              </div>
              <span style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>{data.stats.pendingTasks}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}