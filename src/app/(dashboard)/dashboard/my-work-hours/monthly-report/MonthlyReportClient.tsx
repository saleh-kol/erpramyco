"use client";

import { Wallet, TrendingDown, TrendingUp, Award, Clock, Briefcase } from "lucide-react";

export default function MonthlyReportClient({ data }: { data: any }) {
  const formatRial = (val: number) => val.toLocaleString('fa-IR');

  const cardStyle: React.CSSProperties = {
    backgroundColor: "white", borderRadius: "16px", border: "1px solid #e2e8f0",
    padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: "20px"
  };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a", marginBottom: "24px" }}>{data.periodLabel}</h1>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* ستون راست: جزئیات محاسبات */}
        <div>
          {/* کارکرد و حقوق پایه */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <Clock style={{ width: "20px", height: "20px", color: "#ed6e2b" }} />
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>کارکرد و حقوق پایه</h2>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span>مجموع ساعت کارکرد:</span>
              <span style={{ fontWeight: "bold" }}>{data.totalHours} ساعت</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span>حد نصاب ماهانه:</span>
              <span style={{ fontWeight: "bold" }}>{data.maxHours} ساعت</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
              <span>حقوق پایه (ساعات * {formatRial(data.baseHourlyRate)} ریال):</span>
              <span style={{ fontWeight: "bold", color: "#0f172a" }}>{formatRial(data.baseSalary)} ریال</span>
            </div>
          </div>

          {/* جریمه کم کاری */}
          <div style={{ ...cardStyle, borderColor: "#fecaca" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #fee2e2", paddingBottom: "12px" }}>
              <TrendingDown style={{ width: "20px", height: "20px", color: "#ef4444" }} />
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#991b1b" }}>جریمه کم کاری</h2>
            </div>
            {data.missingHours > 0 ? (
              <>
                <p style={{ fontSize: "13px", color: "#334155", marginBottom: "12px" }}>
                  شما {data.missingHours} ساعت کمتر از حد نصاب کار کرده‌اید. با احتساب {data.penaltyPercent}% جریمه تعیین شده توسط واحد مالی:
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", backgroundColor: "#fef2f2", borderRadius: "8px" }}>
                  <span>مبلغ جریمه:</span>
                  <span style={{ fontWeight: "bold", color: "#ef4444" }}> - {formatRial(data.penaltyAmount)} ریال</span>
                </div>
              </>
            ) : (
              <p style={{ color: "#16a34a", fontWeight: "600" }}>✅ شما حد نصاب ماهانه خود را تکمیل کرده‌اید و جریمه‌ای ندارید.</p>
            )}
          </div>

          {/* پاداش پروژه‌ها */}
          <div style={{ ...cardStyle, borderColor: "#bbf7d0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #dcfce7", paddingBottom: "12px" }}>
              <Award style={{ width: "20px", height: "20px", color: "#16a34a" }} />
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#166534" }}>پاداش پروژه‌ها</h2>
            </div>
            {data.projects.length > 0 ? (
              data.projects.map((p: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed #e2e8f0" }}>
                  <span style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Briefcase style={{ width: "14px", height: "14px", color: "#3b82f6" }} />
                    {p.name}
                  </span>
                  <span style={{ fontWeight: "bold", color: "#16a34a" }}>+ {formatRial(p.bonus)} ریال</span>
                </div>
              ))
            ) : (
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>پروژه‌ای در این ماه تکمیل نکرده‌اید.</p>
            )}
          </div>
        </div>

        {/* ستون چپ: خلاصه نهایی */}
        <div style={{ position: "sticky", top: "24px" }}>
          <div style={{ backgroundColor: "#fff7ed", borderRadius: "20px", padding: "32px", border: "2px solid #ed6e2b", textAlign: "center" }}>
            <Wallet style={{ width: "40px", height: "40px", color: "#ed6e2b", margin: "0 auto 16px auto" }} />
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#0f172a", marginBottom: "24px" }}>حقوق و پاداش نهایی ماه</h2>
            
            <div style={{ textAlign: "right", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>حقوق پایه:</p>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#0f172a" }}>{formatRial(data.baseSalary)} ریال</p>
            </div>
            
            <div style={{ textAlign: "right", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#ef4444" }}>جریمه کم کاری:</p>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#ef4444" }}> - {formatRial(data.penaltyAmount)} ریال</p>
            </div>

            <div style={{ textAlign: "right", marginBottom: "24px" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#16a34a" }}>پاداش پروژه‌ها:</p>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#16a34a" }}>+ {formatRial(data.totalBonus)} ریال</p>
            </div>

            <div style={{ borderTop: "2px dashed #ed6e2b", paddingTop: "16px" }}>
              <p style={{ margin: 0, fontSize: "16px", color: "#c2410c", fontWeight: "bold" }}>مبلغ نهایی قابل دریافت:</p>
              <p style={{ margin: "8px 0 0 0", fontSize: "32px", fontWeight: "bold", color: "#0f172a" }}>
                {formatRial(data.netSalary)} <span style={{ fontSize: "16px", fontWeight: "normal" }}>ریال</span>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}