"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, Sunrise, MoonStar, ChevronLeft, CalendarDays, Clock, CalendarCheck, Sparkles,
} from "lucide-react";

const fmt = (v: any) => Number(v || 0).toLocaleString("fa-IR", { maximumFractionDigits: 2 });

export default function MyWorkHoursClient({ data }: { data: any }) {
  const router = useRouter();
  const [monthLabel, setMonthLabel] = useState("");

  // برچسب ماه شمسی سمت کلاینت — برای جلوگیری از hydration mismatch در useEffect
  useEffect(() => {
    setMonthLabel(new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long", year: "numeric" }).format(new Date()));
  }, []);

  const weekLabels: any = {
    1: "هفته اول", 2: "هفته دوم", 3: "هفته سوم", 4: "هفته چهارم", 5: "روزهای پایانی ماه",
  };

  const periods: any[] = [
    { key: "week1",    label: "هفته اول",           d: data.week1 },
    { key: "week2",    label: "هفته دوم",           d: data.week2 },
    { key: "week3",    label: "هفته سوم",           d: data.week3 },
    { key: "week4",    label: "هفته چهارم",         d: data.week4 },
    { key: "monthEnd", label: "روزهای پایانی ماه",  d: data.monthEnd },
  ];

  const sumOf = (field: string) =>
    periods.reduce((s: number, p: any) => s + Number(p.d?.[field] || 0), 0);

  const totalEffective = sumOf("effectiveHours");
  const totalActual = sumOf("actualHours");
  const totalDays = sumOf("days");

  const kpis = [
    { icon: <TrendingUp style={{ width: 19, height: 19 }} />,    label: "ساعت موثر این ماه",      value: fmt(totalEffective),  unit: "ساعت", bg: "#ffedd5", color: "#c2410c" },
    { icon: <Clock style={{ width: 19, height: 19 }} />,         label: "ساعت واقعی ثبت‌شده",     value: fmt(totalActual),     unit: "ساعت", bg: "#dbeafe", color: "#1d4ed8" },
    { icon: <CalendarCheck style={{ width: 19, height: 19 }} />, label: "روزهای کارکرد",          value: fmt(totalDays),       unit: "روز",  bg: "#dcfce7", color: "#16a34a" },
    { icon: <Sunrise style={{ width: 19, height: 19 }} />,       label: "جمعه‌کاری + تعطیل‌کاری", value: fmt(Number(data.friday?.effectiveHours || 0) + Number(data.holiday?.effectiveHours || 0)), unit: "ساعت", bg: "#fef3c7", color: "#b45309" },
  ];

  const openPeriod = (period: string) => router.push(`/dashboard/my-work-hours/period?period=${period}`);

  const cardBase: React.CSSProperties = {
    backgroundColor: "white", borderRadius: "16px", padding: "18px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)", cursor: "pointer", transition: "all 0.25s ease",
  };
  const hover = {
    onMouseEnter: (e: any) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 18px rgba(15,23,42,0.08)"; },
    onMouseLeave: (e: any) => { e.currentTarget.style.transform = "translateY(0)"; },
  };

  const renderPeriodCard = (p: any) => {
    const isCurrent = p.key === "monthEnd" ? data.currentWeek === 5 : data.currentWeek === Number(String(p.key).replace("week", ""));
    const d = p.d || {};
    return (
      <div key={p.key} onClick={() => openPeriod(p.key)}
        style={{ ...cardBase, border: `1.5px solid ${isCurrent ? "#ed6e2b" : "#e2e8f0"}`, boxShadow: isCurrent ? "0 6px 16px rgba(237,110,43,0.15)" : "0 1px 3px rgba(0,0,0,0.04)" }}
        {...hover}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>{p.label}</h3>
          {isCurrent ? (
            <span style={{ fontSize: "10px", backgroundColor: "#fff7ed", color: "#c2410c", padding: "3px 10px", borderRadius: "999px", fontWeight: 700, border: "1px solid #fed7aa" }}>دوره جاری</span>
          ) : (
            <ChevronLeft style={{ width: 16, height: 16, color: "#cbd5e1" }} />
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ backgroundColor: "#fff7ed", padding: "10px", borderRadius: "12px" }}>
            <TrendingUp style={{ width: 20, height: 20, color: "#ed6e2b" }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#c2410c" }}>
              {fmt(d.effectiveHours)} <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>ساعت موثر</span>
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>واقعی: {fmt(d.actualHours)} ساعت — {fmt(d.days)} روز</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", padding: "24px" }}>

      {/* هدر */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ffedd5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CalendarDays style={{ width: 22, height: 22, color: "#ed6e2b" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "bold", color: "#0f172a" }}>ساعات کارکرد من</h1>
            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>ساعت موثر بر اساس ضریب تایید مدیر محاسبه می‌شود — برای ریز فعالیت‌ها روی هر کارت کلیک کنید</p>
          </div>
        </div>
        {monthLabel && (
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#9a3412", backgroundColor: "#ffedd5", border: "1px solid #fed7aa", padding: "8px 16px", borderRadius: "999px" }}>
            {monthLabel}
          </span>
        )}
      </div>

      {/* کارت‌های خلاصه ماه جاری */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {kpis.map((k: any, i: number) => (
          <div key={i} style={{ ...cardBase, cursor: "default", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{k.label}</span>
              <span style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: k.bg, color: k.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{k.icon}</span>
            </div>
            <p style={{ margin: "10px 0 0 0", fontSize: "24px", fontWeight: "bold", color: "#0f172a" }}>
              {k.value} {k.unit && <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}>{k.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* بنر دوره جاری */}
      <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", border: "1px solid #fed7aa", borderRadius: "16px", padding: "16px 22px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "#ed6e2b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Sparkles style={{ width: 20, height: 20, color: "white" }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "bold", color: "#0f172a" }}>
            شما در حال حاضر در «{weekLabels[data.currentWeek]}» قرار دارید
          </h2>
          <p style={{ margin: "3px 0 0 0", fontSize: "12.5px", color: "#c2410c" }}>
            کارکرد این دوره زنده به‌روز می‌شود و ساعت موثر آن با ضریب تایید مدیر محاسبه می‌گردد.
          </p>
        </div>
      </div>

      {/* کارت‌های پنج دوره ماه */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {periods.map((p: any) => renderPeriodCard(p))}
      </div>

      {/* جمعه‌کاری و تعطیل‌کاری */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
        <div onClick={() => openPeriod("friday")} style={{ ...cardBase, backgroundColor: "#fffbeb", border: "1.5px solid #fde68a" }} {...hover}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#92400e" }}>جمعه‌های کاری</h3>
            <Sunrise style={{ width: 18, height: 18, color: "#d97706" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ backgroundColor: "#fef3c7", padding: "10px", borderRadius: "12px" }}>
              <TrendingUp style={{ width: 20, height: 20, color: "#d97706" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#b45309" }}>
                {fmt(data.friday?.effectiveHours)} <span style={{ fontSize: "11px", fontWeight: 600, color: "#b45309" }}>ساعت موثر</span>
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#b45309" }}>واقعی: {fmt(data.friday?.actualHours)} ساعت — {fmt(data.friday?.days)} جمعه</p>
            </div>
          </div>
        </div>

        <div onClick={() => openPeriod("holiday")} style={{ ...cardBase, backgroundColor: "#eff6ff", border: "1.5px solid #bfdbfe" }} {...hover}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#1e40af" }}>تعطیلات کاری</h3>
            <MoonStar style={{ width: 18, height: 18, color: "#2563eb" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ backgroundColor: "#dbeafe", padding: "10px", borderRadius: "12px" }}>
              <TrendingUp style={{ width: 20, height: 20, color: "#2563eb" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#1d4ed8" }}>
                {fmt(data.holiday?.effectiveHours)} <span style={{ fontSize: "11px", fontWeight: 600, color: "#1d4ed8" }}>ساعت موثر</span>
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#1d4ed8" }}>واقعی: {fmt(data.holiday?.actualHours)} ساعت — {fmt(data.holiday?.days)} روز</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}