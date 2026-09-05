"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Calendar, Briefcase, AlertCircle, FileText, Lock, CheckCircle } from "lucide-react";

export default function MyWorkHoursClient({ data }: { data: any }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  const weekLabels: any = {
    1: "هفته اول", 2: "هفته دوم", 3: "هفته سوم", 4: "هفته چهارم", 5: "روزهای پایانی ماه"
  };

  // بررسی اینکه آیا امروز بین ۱ تا ۳ ماه است یا خیر
  const today = new Date();
  const isReportAvailable = today.getDate() >= 1 && today.getDate() <= 3;

  const handleLockedClick = () => {
    setToast("دسترسی به گزارش ماه گذشته فقط از ۱ تا ۳ام هر ماه امکان‌پذیر است.");
    setTimeout(() => setToast(null), 3500);
  };

  const renderWeekCard = (period: string, title: string, weekData: any, isCurrent: boolean) => (
    <div 
      onClick={() => router.push(`/dashboard/my-work-hours/period?period=${period}`)}
      style={{ 
        backgroundColor: "white", borderRadius: "16px", 
        border: `1px solid ${isCurrent ? "#ed6e2b" : "#e2e8f0"}`, 
        padding: "20px", boxShadow: isCurrent ? "0 4px 12px rgba(237, 110, 43, 0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "all 0.3s", cursor: "pointer"
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "#0f172a" }}>{title}</h3>
        {isCurrent && <span style={{ fontSize: "10px", backgroundColor: "#fff7ed", color: "#c2410c", padding: "4px", borderRadius: "20px", fontWeight: 600 }}>هفته جاری</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ backgroundColor: "#f8fafc", padding: "10px", borderRadius: "10px" }}>
          <Clock style={{ width: "20px", height: "20px", color: "#ed6e2b" }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>{weekData.hours} <span style={{ fontSize: "12px", color: "#64748b" }}>ساعت</span></p>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{weekData.days} روز کاری</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      
      {/* باکس هشدار هفته جاری */}
      <div style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "16px", padding: "16px 24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <AlertCircle style={{ width: "24px", height: "24px", color: "#ed6e2b" }} />
        <div>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>شما در حال حاضر در {weekLabels[data.currentWeek]} ماه قرار دارید</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#c2410c" }}>برای مشاهده ریز گزارشات هر بخش، روی کادر آن کلیک کنید.</p>
        </div>
      </div>

      {/* دکمه گزارش پاداش و جریمه ماه */}
      {isReportAvailable ? (
        <div 
          onClick={() => router.push('/dashboard/my-work-hours/monthly-report')}
          style={{ 
            backgroundColor: "white", border: "2px solid #16a34a", borderRadius: "16px", padding: "20px", 
            marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", transition: "all 0.3s", boxShadow: "0 4px 12px rgba(22, 163, 74, 0.15)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ backgroundColor: "#16a34a", padding: "12px", borderRadius: "12px" }}>
              <FileText style={{ width: "24px", height: "24px", color: "white" }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>گزارش پاداش و جریمه ماه گذشته</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>خلاصه کارکرد، کسری ساعت، جریمه‌ها و پاداش نهایی ماه قبل آماده مشاهده است.</p>
            </div>
          </div>
        </div>
      ) : (
        <div 
          onClick={handleLockedClick}
          style={{ 
            backgroundColor: "white", border: "2px solid #e2e8f0", borderRadius: "16px", padding: "20px", 
            marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "not-allowed", transition: "all 0.3s", opacity: 0.6
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ backgroundColor: "#cbd5e1", padding: "12px", borderRadius: "12px", position: "relative" }}>
              <FileText style={{ width: "24px", height: "24px", color: "white" }} />
              <Lock style={{ position: "absolute", bottom: "-4px", right: "-4px", width: "16px", height: "16px", color: "#64748b", backgroundColor: "white", borderRadius: "50%" }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#94a3b8" }}>گزارش پاداش و جریمه ماه گذشته</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>این بخش فقط از ۱ تا ۳ام هر ماه فعال می‌شود.</p>
            </div>
          </div>
        </div>
      )}

      {/* باکس‌های هفته‌های ۱ تا ۴ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {renderWeekCard("week1", "هفته اول", data.week1, data.currentWeek === 1)}
        {renderWeekCard("week2", "هفته دوم", data.week2, data.currentWeek === 2)}
        {renderWeekCard("week3", "هفته سوم", data.week3, data.currentWeek === 3)}
        {renderWeekCard("week4", "هفته چهارم", data.week4, data.currentWeek === 4)}
      </div>

      {/* باکس‌های روزهای پایانی ماه، جمعه کاری و تعطیل کاری */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
        {renderWeekCard("monthEnd", "روزهای پایانی ماه", data.monthEnd, data.currentWeek === 5)}
        
        <div 
          onClick={() => router.push(`/dashboard/my-work-hours/period?period=friday`)}
          style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", cursor: "pointer", transition: "all 0.3s" }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "#0f172a" }}>جمعه کاری</h3>
            <Calendar style={{ width: "18px", height: "18px", color: "#ef4444" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ backgroundColor: "#fef2f2", padding: "10px", borderRadius: "10px" }}>
              <Clock style={{ width: "20px", height: "20px", color: "#ef4444" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>{data.friday.hours} <span style={{ fontSize: "12px", color: "#64748b" }}>ساعت</span></p>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{data.friday.days} روز</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => router.push(`/dashboard/my-work-hours/period?period=holiday`)}
          style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", cursor: "pointer", transition: "all 0.3s" }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "#0f172a" }}>تعطیل کاری</h3>
            <Briefcase style={{ width: "18px", height: "18px", color: "#3b82f6" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ backgroundColor: "#eff6ff", padding: "10px", borderRadius: "10px" }}>
              <Clock style={{ width: "20px", height: "20px", color: "#3b82f6" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>{data.holiday.hours} <span style={{ fontSize: "12px", color: "#64748b" }}>ساعت</span></p>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{data.holiday.days} روز</p>
            </div>
          </div>
        </div>
      </div>

      {/* نوتیفیکیشن پیام قفل */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px rgba(0,0,0,0.3)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
          <Lock style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
          {toast}
        </div>
      )}
    </div>
  );
}